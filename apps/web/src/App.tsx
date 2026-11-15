import { PRODUCT } from '@app/core';

export function App() {
  return (
    <main className="shell">
      <h1>{PRODUCT.name}</h1>
      <p>{PRODUCT.tagline.en}</p>
      <p className="notice">{PRODUCT.simulatedDataNotice.en}</p>
    </main>
  );
}
