'use client';

import { QueryClientProvider, QueryClient } from 'react-query';
import { FC, ReactNode } from 'react';
import { MessagesProvider } from '@/context/messages';

interface ProviderProps {
    children: ReactNode;
}

const Providers: FC<ProviderProps> = ({ children }) => {
    const queryClient = new QueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            <MessagesProvider>{children}</MessagesProvider>
        </QueryClientProvider>
    );
};

export default Providers;
