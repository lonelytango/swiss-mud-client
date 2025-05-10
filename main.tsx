import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { VariablesProvider } from './contexts/VariablesContext';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<VariablesProvider>
			<App />
		</VariablesProvider>
	</StrictMode>
);
