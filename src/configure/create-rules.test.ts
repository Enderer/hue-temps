import { buildRules } from './create-rules';
import { buildRulesButton } from './create-rules-button';

jest.mock('./create-rules-button');

describe('create-rules', () => {

  const mockBuildRulesButton = buildRulesButton as jest.Mock;
  mockBuildRulesButton.mockReturnValue('RULES');

  it('should create button rules', () => {
    const scenes = { day: 'SCENE_DAY', evening: 'SCENE_EVENING', night: 'SCENE_NIGHT' };
    const sensor = { id: 'SCENSOR_ID', name: 'NAME' };
    const rules = buildRules({ ...sensor, productName: 'Hue Smart button' }, undefined, 'GROUP_ID', scenes);
    expect(rules).toEqual('RULES');
    expect(mockBuildRulesButton).toHaveBeenCalledWith('SCENSOR_ID', 'GROUP_ID', scenes);
  });
});
