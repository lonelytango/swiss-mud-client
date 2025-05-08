export const FeatureFlag = {
	IS_MOCK_ENABLED: 'is_mock_enabled',
} as const;

type FeatureFlag = (typeof FeatureFlag)[keyof typeof FeatureFlag];

export function isMockEnabled(): boolean {
	return isFeatureFlagEnabled(FeatureFlag.IS_MOCK_ENABLED);
}

function isFeatureFlagEnabled(flag: FeatureFlag): boolean {
	switch (flag) {
		case FeatureFlag.IS_MOCK_ENABLED:
			return true;
		default:
			return false;
	}
}
