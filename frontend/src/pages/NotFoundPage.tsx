import { Link } from 'react-router-dom';
import type { ReactElement } from 'react';
import { MessagePage } from '../components/MessagePage';

export function NotFoundPage(): ReactElement {
  return (
    <MessagePage
      code="404"
      title="Page not found"
      message="The page you're looking for doesn't exist or has moved."
      action={<Link to="/">← Back to upload</Link>}
    />
  );
}
