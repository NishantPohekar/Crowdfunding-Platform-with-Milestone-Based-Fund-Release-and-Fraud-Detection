package com.trustfund;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ControllerSmokeTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void allControllersHandleTheirMainRoutes() throws Exception {
        String creatorEmail = "smoke-creator-%s@test.com".formatted(UUID.randomUUID());
        String donorEmail = "smoke-donor-%s@test.com".formatted(UUID.randomUUID());

        JsonNode registered = postJson("/api/auth/register", """
                {
                  "name": "Smoke Test Creator",
                  "email": "%s",
                  "password": "Creator@123456",
                  "role": "CREATOR"
                }
                """.formatted(creatorEmail), null, 200);
        postJson("/api/auth/refresh", """
                {"refreshToken": "%s"}
                """.formatted(registered.get("refreshToken").asText()), null, 200);
        postJson("/api/auth/register", """
                {
                  "name": "Smoke Test Donor",
                  "email": "%s",
                  "password": "Donor@123456",
                  "role": "DONOR"
                }
                """.formatted(donorEmail), null, 200);

        String adminToken = login("main-admin@example.com", "Admin@123456");
        String creatorToken = login(creatorEmail, "Creator@123456");
        String donorToken = login(donorEmail, "Donor@123456");

        JsonNode createdCampaign = postJson("/api/campaigns", """
                {
                  "title": "Controller Smoke Campaign",
                  "description": "A controller smoke test campaign",
                  "targetAmount": 100.00,
                  "milestones": [
                    {
                      "title": "Milestone 1",
                      "description": "First release",
                      "amount": 50.00,
                      "dueDate": "2026-12-31"
                    }
                  ]
                }
                """, creatorToken, 200);
        String campaignId = createdCampaign.get("id").asText();
        String milestoneId = createdCampaign.get("milestones").get(0).get("id").asText();

        getJson("/api/campaigns", null, 200);
        getJson("/api/campaigns/" + campaignId, null, 200);
        getJson("/api/campaigns/my", creatorToken, 200);
        putJson("/api/campaigns/" + campaignId + "/approve", "", adminToken, 200);

        postJson("/api/donations", """
                {
                  "campaignId": "%s",
                  "amount": 100.00,
                  "paymentMethod": "UPI"
                }
                """.formatted(campaignId), donorToken, 200);
        getJson("/api/donations/my", donorToken, 200);
        postJson("/api/donations/webhook", """
                {"event": "payment.captured"}
                """, null, 200);

        postJson("/api/milestones/" + milestoneId + "/proof", """
                {
                  "proofUrl": "https://example.com/proof.pdf",
                  "notes": "Work completed"
                }
                """, creatorToken, 200);
        putJson("/api/milestones/" + milestoneId + "/verify", "", adminToken, 200);
        putJson("/api/milestones/" + milestoneId + "/release", "", adminToken, 200);

        JsonNode complaint = postJson("/api/complaints", """
                {
                  "campaignId": "%s",
                  "description": "Smoke complaint"
                }
                """.formatted(campaignId), donorToken, 200);
        getJson("/api/complaints", adminToken, 200);
        putJson("/api/complaints/" + complaint.get("id").asText() + "/resolve", "", adminToken, 200);

        getJson("/api/fraud/alerts", adminToken, 200);

        JsonNode notifications = getJson("/api/notifications", creatorToken, 200);
        assertThat(notifications).isNotEmpty();
        putJson("/api/notifications/" + notifications.get(0).get("id").asText() + "/read", "", creatorToken, 200);
    }

    private String login(String email, String password) throws Exception {
        JsonNode response = postJson("/api/auth/login", """
                {
                  "email": "%s",
                  "password": "%s"
                }
                """.formatted(email, password), null, 200);
        return response.get("accessToken").asText();
    }

    private JsonNode getJson(String path, String token, int expectedStatus) throws Exception {
        MvcResult result = mockMvc.perform(get(path)
                        .headers(headers(token)))
                .andExpect(status().is(expectedStatus))
                .andReturn();
        return readJson(result);
    }

    private JsonNode postJson(String path, String body, String token, int expectedStatus) throws Exception {
        MvcResult result = mockMvc.perform(post(path)
                        .headers(headers(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().is(expectedStatus))
                .andReturn();
        return readJson(result);
    }

    private JsonNode putJson(String path, String body, String token, int expectedStatus) throws Exception {
        MvcResult result = mockMvc.perform(put(path)
                        .headers(headers(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().is(expectedStatus))
                .andReturn();
        return readJson(result);
    }

    private org.springframework.http.HttpHeaders headers(String token) {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        if (token != null) {
            headers.setBearerAuth(token);
        }
        return headers;
    }

    private JsonNode readJson(MvcResult result) throws Exception {
        String body = result.getResponse().getContentAsString();
        if (body == null || body.isBlank()) {
            return objectMapper.createObjectNode();
        }
        return objectMapper.readTree(body);
    }
}
