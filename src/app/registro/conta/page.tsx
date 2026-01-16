import React, { Suspense } from 'react'
import RegistroContaClient from './RegistroContaClient';

export default function RegistroContaPage() {
  return (
    <Suspense fallback={<div />}> 
      <RegistroContaClient />
    </Suspense>
  );
}
