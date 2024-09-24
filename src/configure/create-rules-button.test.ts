import { buildRulesButton } from './create-rules-button';

describe('create-rules-button', () => {
  it('should create Hue Smart button rules', () => {
    expect(buildRulesButton('SCENSOR_ID', 'GROUP_ID', { day: 'SCENE_DAY', evening: 'SCENE_EVENING', night: 'SCENE_NIGHT' })).toMatchSnapshot();
  });
});
