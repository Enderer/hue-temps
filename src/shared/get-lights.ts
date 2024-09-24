import { getResource } from './get-resource';
import { Light } from './light';

export const getLights = getResource('lights', ({ id, o }) => {
  const light = o as Light;
  const { name } = light;
  const on = light?.state?.on;
  const ct = light?.capabilities?.control?.ct;
  const maxlumen = light?.capabilities?.control?.maxlumen;
  const newLight: Light = { id, name };
  if (on != null) {
    newLight.state = { on };
  }
  if (ct || maxlumen) {
    const control = { maxlumen, ct };
    newLight.capabilities = { control };
  }
  return newLight;
});
