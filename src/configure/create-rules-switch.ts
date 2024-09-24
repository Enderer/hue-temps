import { SceneLabel, Scenes } from '../shared/scene';
import { SwitchSide } from './hue-mapping';
import { Rule } from './create-rules-button';

const TRANSITION_TIME = 2;
export const BUTTON_LEFT_UP = '16';
export const BUTTON_LEFT_DOWN = '17';
export const BUTTON_RIGHT_UP = '19';
export const BUTTON_RIGHT_DOWN = '18';
export const TIME_NIGHT_START = 'T23:00:00';
export const TIME_NIGHT_END = 'T06:00:00';

export const buildRulesSwitch = (
  sensorId: string,
  side: SwitchSide,
  groupId: string,
  scenes: Scenes
): Rule[] => {
  if (!(side === SwitchSide.Left || side === SwitchSide.Right)) {
    throw new Error(`Invalid switch side ${side}`);
  }
  const offEvent = side === SwitchSide.Left ? BUTTON_LEFT_DOWN : BUTTON_RIGHT_DOWN;
  const onEvent = side === SwitchSide.Left ? BUTTON_LEFT_UP : BUTTON_RIGHT_UP;

  return [
    //   // Off Rule
    {
      name: `sensor-${sensorId}-off`,
      recycle: true,
      conditions: [
        {
          address: `/sensors/${sensorId}/state/buttonevent`,
          operator: 'eq',
          value: offEvent
        },
        {
          address: `/sensors/${sensorId}/state/lastupdated`,
          operator: 'dx'
        }
      ],
      actions: [
        {
          address: `/groups/${groupId}/action`,
          method: 'PUT',
          body: {
            on: false,
            transitiontime: TRANSITION_TIME
          }
        }
      ]
    },
    // On Rule - Day
    {
      name: `sensor-${sensorId}-on-${SceneLabel.Day}`,
      recycle: true,
      conditions: [
        {
          address: `/sensors/${sensorId}/state/buttonevent`,
          operator: 'eq',
          value: onEvent
        },
        {
          address: `/sensors/${sensorId}/state/lastupdated`,
          operator: 'dx'
        },
        {
          address: '/sensors/1/state/daylight',
          operator: 'eq',
          value: 'true'
        }
      ],
      actions: [
        {
          address: `/groups/${groupId}/action`,
          method: 'PUT',
          body: {
            scene: scenes.day,
            transitiontime: TRANSITION_TIME
          }
        }
      ]
    },
    // On Rule - Evening
    {
      name: `sensor-${sensorId}-on-${SceneLabel.Evening}`,
      recycle: true,
      conditions: [
        {
          address: `/sensors/${sensorId}/state/buttonevent`,
          operator: 'eq',
          value: onEvent
        },
        {
          address: `/sensors/${sensorId}/state/lastupdated`,
          operator: 'dx'
        },
        {
          address: '/sensors/1/state/daylight',
          operator: 'eq',
          value: 'false'
        },
        {
          address: '/config/localtime',
          operator: 'not in',
          value: `${TIME_NIGHT_START}/${TIME_NIGHT_END}`
        }
      ],
      actions: [
        {
          address: `/groups/${groupId}/action`,
          method: 'PUT',
          body: {
            scene: scenes.evening,
            transitiontime: TRANSITION_TIME
          }
        }
      ]
    },
    // On Rule - Night
    {
      name: `sensor-${sensorId}-on-${SceneLabel.Night}`,
      recycle: true,
      conditions: [
        {
          address: `/sensors/${sensorId}/state/buttonevent`,
          operator: 'eq',
          value: onEvent
        },
        {
          address: `/sensors/${sensorId}/state/lastupdated`,
          operator: 'dx'
        },
        {
          address: '/sensors/1/state/daylight',
          operator: 'eq',
          value: 'false'
        },
        {
          address: '/config/localtime',
          operator: 'in',
          value: `${TIME_NIGHT_START}/${TIME_NIGHT_END}`
        }
      ],
      actions: [
        {
          address: `/groups/${groupId}/action`,
          method: 'PUT',
          body: {
            scene: scenes.night,
            transitiontime: TRANSITION_TIME
          }
        }
      ]
    }
  ];
};
