import { SceneLabel, Scenes } from '../shared/scene';

const TRANSITION_TIME = 2;
const BUTTON_EVENT = '1000'; // Button down
export const TIME_NIGHT_START = 'T23:00:00';
export const TIME_NIGHT_END = 'T06:00:00';

export interface Rule {
  name: string;
  recycle: boolean;
  conditions: {
    address: string;
    operator: string;
    value?: string;
  }[],
  actions: {
    address: string;
    method: string;
    body: {
      on?: boolean;
      transitiontime: number;
      scene?: string;
    }
  }[]
}

export const buildRulesButton = (sensorId: string, groupId: string, scenes: Scenes): Rule[] => {
  return [
    // Off Rule
    {
      name: `sensor:${sensorId}:off`,
      recycle: true,
      conditions: [
        {
          address: `/sensors/${sensorId}/state/buttonevent`,
          operator: 'eq',
          value: BUTTON_EVENT
        },
        {
          address: `/sensors/${sensorId}/state/lastupdated`,
          operator: 'dx'
        },
        {
          address: `/groups/${groupId}/state/any_on`,
          operator: 'eq',
          value: 'true'
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
    // On - Day
    {
      name: `sensor-${sensorId}-on-${SceneLabel.Day}`,
      recycle: true,
      conditions: [
        {
          address: `/sensors/${sensorId}/state/buttonevent`,
          operator: 'eq',
          value: BUTTON_EVENT
        },
        {
          address: `/sensors/${sensorId}/state/lastupdated`,
          operator: 'dx'
        },
        {
          address: '/sensors/1/state/daylight',
          operator: 'eq',
          value: 'true'
        },
        {
          address: `/groups/${groupId}/state/any_on`,
          operator: 'eq',
          value: 'false'
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

    // On - Evening
    {
      name: `sensor-${sensorId}-on-${SceneLabel.Evening}`,
      recycle: true,
      conditions: [
        {
          address: `/sensors/${sensorId}/state/buttonevent`,
          operator: 'eq',
          value: BUTTON_EVENT
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
          address: `/groups/${groupId}/state/any_on`,
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

    // On - Night
    {
      name: `sensor-${sensorId}-on-${SceneLabel.Night}`,
      recycle: true,
      conditions: [
        {
          address: `/sensors/${sensorId}/state/buttonevent`,
          operator: 'eq',
          value: BUTTON_EVENT
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
          address: `/groups/${groupId}/state/any_on`,
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
