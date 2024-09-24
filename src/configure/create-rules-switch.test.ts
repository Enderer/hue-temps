import { buildRulesSwitch } from './create-rules-switch';
import { SwitchSide } from './hue-mapping';

jest.mock('./create-rules-button');

describe('create-rules', () => {
  const scenes = { day: 'SCENE_DAY', evening: 'SCENE_EVENING', night: 'SCENE_NIGHT' };

  it('should create switch rules', () => {
    const rules = buildRulesSwitch('SENSOR', SwitchSide.Left, 'GROUP', scenes);
    expect(rules).toMatchSnapshot();
  });

  it('should error when missing switch side', () => {
    expect(() => buildRulesSwitch('SENSOR', undefined as unknown as SwitchSide, 'GROUP', scenes)).toThrowError();
  });
});
