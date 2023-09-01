import type { GraphNodeOutput, GraphPort } from '@secretflow/dag';
import { DefaultHookService } from '@secretflow/dag';

import { DefaultComponentTreeService } from '@/modules/component-tree/component-tree-service';
import { getModel } from '@/util/valtio-helper';

export class GraphHookService extends DefaultHookService {
  componentService = getModel(DefaultComponentTreeService);

  async createResult(nodeId: string, codeName: string) {
    const [domain, name] = codeName.split('/');
    const component = await this.componentService.getComponentConfig({
      domain,
      name,
    });

    if (component) {
      const results: GraphNodeOutput[] = [];
      const { outputs } = component;
      outputs.forEach((output, index) => {
        results.push({
          id: `${nodeId}-output-${index}`,
          name: output.name,
          type: output.types[0].split('.')[1],
        });
      });

      return results;
    }
    return [];
  }

  async createPort(nodeId: string, codeName: string) {
    const [domain, name] = codeName.split('/');

    const component = await this.componentService.getComponentConfig({
      domain,
      name,
    });

    if (component) {
      const ports: GraphPort[] = [];
      const { inputs, outputs } = component;
      inputs?.forEach((input, index) => {
        ports.push({
          id: `${nodeId}-input-${index}`,
          group: 'top',
          type: input.types[0],
          attrs: {
            circle: {
              magnet: false,
            },
          },
        });
      });

      outputs.forEach((output, index) => {
        ports.push({
          id: `${nodeId}-output-${index}`,
          group: 'bottom',
          type: output.types[0],
          attrs: {
            circle: {
              magnet: false,
            },
          },
        });
      });

      return ports;
    }
    return [];
  }
}
