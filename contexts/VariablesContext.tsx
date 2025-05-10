import React, { createContext, useContext, useEffect, useState } from 'react';
import { Variable } from '../types';

interface VariablesContextType {
	variables: Variable[];
	setVariables: React.Dispatch<React.SetStateAction<Variable[]>>;
}

const VariablesContext = createContext<VariablesContextType | undefined>(
	undefined
);

export function VariablesProvider({ children }: { children: React.ReactNode }) {
	const [variables, setVariables] = useState<Variable[]>([]);

	// Load variables from localStorage on mount
	useEffect(() => {
		const storedVariables = localStorage.getItem('mud_variables');
		if (storedVariables) {
			try {
				const parsedVariables = JSON.parse(storedVariables);
				setVariables(parsedVariables);
			} catch (e) {
				console.error('Failed to parse variables:', e);
			}
		}
	}, []);

	// Save variables to localStorage whenever they change
	useEffect(() => {
		if (variables.length > 0) {
			localStorage.setItem('mud_variables', JSON.stringify(variables));
		}
	}, [variables]);

	return (
		<VariablesContext.Provider value={{ variables, setVariables }}>
			{children}
		</VariablesContext.Provider>
	);
}

export function useVariables() {
	const context = useContext(VariablesContext);
	if (context === undefined) {
		throw new Error('useVariables must be used within a VariablesProvider');
	}
	return context;
}
