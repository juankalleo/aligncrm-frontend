 'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SelecionarProjetoPage() {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect legacy route to workspace selector
    router.replace('/selecionar-workspace');
  }, [router]);

  return null;
}
