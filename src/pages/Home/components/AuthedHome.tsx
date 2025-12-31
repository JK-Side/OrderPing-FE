import { useState } from 'react';
import EmptyMain from './EmptyMain';
import ReadyMain from './ReadyMain';

export default function AuthedHome() {
  const [hasShop] = useState(true);

  return <>{hasShop ? <ReadyMain /> : <EmptyMain />}</>;
}
