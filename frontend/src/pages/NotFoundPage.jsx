import { Link } from 'react-router-dom';
import PageTransition from '../components/common/PageTransition.jsx';

export default function NotFoundPage() {
  return (
    <PageTransition className="not-found">
      <h1>404</h1>
      <p>This page is outside the funding map.</p>
      <Link className="btn btn-cfx" to="/">Go Home</Link>
    </PageTransition>
  );
}
