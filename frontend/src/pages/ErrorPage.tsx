import type { ReactElement } from 'react';
import { MessagePage } from '../components/MessagePage';

export function ErrorPage(): ReactElement {
  return (
    <MessagePage
      code="500"
      title="Something went wrong"
      message="An unexpected error occurred. Reloading the page usually fixes it."
      action={
        <button type="button" onClick={() => window.location.reload()}>
          Reload
        </button>
      }
    />
  );
}
