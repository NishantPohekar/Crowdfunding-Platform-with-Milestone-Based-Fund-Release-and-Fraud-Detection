import { useEffect, useMemo, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import PageTransition from '../components/common/PageTransition.jsx';
import PaginationControls from '../components/common/PaginationControls.jsx';
import DonationCard from '../components/domain/DonationCard.jsx';
import { donationService } from '../services/donationService.js';
import { useToast } from '../contexts/ToastContext.jsx';

const PAGE_SIZE = 6;

export default function MyDonationsPage() {
  const [donations, setDonations] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('LATEST');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();

  useEffect(() => {
    setLoading(true);
    donationService.mine({ page: 0, size: 1000 })
      .then((data) => setDonations(data.content || []))
      .catch((error) => notify(error.message, 'error'))
      .finally(() => setLoading(false));
  }, [notify]);

  useEffect(() => {
    setPage(0);
  }, [query, sortBy, status]);

  const filteredDonations = useMemo(() => {
    const search = query.trim().toLowerCase();
    const visible = donations.filter((donation) => {
      const matchesSearch = !search || [
        donation.campaignTitle,
        donation.paymentStatus,
        donation.paymentMethod,
        String(donation.amount || '')
      ].some((value) => value?.toLowerCase().includes(search));
      const matchesStatus = status === 'ALL' || donation.paymentStatus === status;
      return matchesSearch && matchesStatus;
    });
    return [...visible].sort((a, b) => {
      const left = new Date(a.donatedAt || 0);
      const right = new Date(b.donatedAt || 0);
      if (sortBy === 'AMOUNT_HIGH') return Number(b.amount || 0) - Number(a.amount || 0);
      if (sortBy === 'AMOUNT_LOW') return Number(a.amount || 0) - Number(b.amount || 0);
      return sortBy === 'OLDEST' ? left - right : right - left;
    });
  }, [donations, query, sortBy, status]);

  const pagedDonations = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredDonations.slice(start, start + PAGE_SIZE);
  }, [filteredDonations, page]);

  return (
    <PageTransition>
      <section className="page-head">
        <div>
          <p className="eyebrow">Donor Hub</p>
          <h2>My Donations</h2>
        </div>
      </section>
      <div className="filter-bar donation-filter-bar">
        <label className="filter-search"><FiSearch /><input placeholder="Search donations" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="ALL">All Status</option>
          <option value="SUCCESS">Successful</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="LATEST">Latest First</option>
          <option value="OLDEST">Oldest First</option>
          <option value="AMOUNT_HIGH">Amount High-Low</option>
          <option value="AMOUNT_LOW">Amount Low-High</option>
        </select>
      </div>
      {!loading && <PaginationControls page={page} pageSize={PAGE_SIZE} totalItems={filteredDonations.length} onPageChange={setPage} />}
      {loading ? <p className="empty-state">Loading donations...</p> : <div className="stack-list">{pagedDonations.map((donation) => <DonationCard key={donation.id} donation={donation} />)}</div>}
      {!loading && <PaginationControls page={page} pageSize={PAGE_SIZE} totalItems={filteredDonations.length} onPageChange={setPage} />}
      {!loading && filteredDonations.length === 0 && <p className="empty-state">No donations found.</p>}
    </PageTransition>
  );
}
