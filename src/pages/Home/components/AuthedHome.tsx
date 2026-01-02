import { useState } from 'react';
import EmptyMain from './EmptyMain';
import ReadyMain from './ReadyMain';

export default function AuthedHome() {
  const [hasShop] = useState(false);

  return <>{hasShop ? <ReadyMain /> : <EmptyMain />}</>;
}
