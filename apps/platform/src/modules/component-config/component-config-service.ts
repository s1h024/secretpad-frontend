import { Emitter } from '@secretflow/utils';

import { Model, getModel } from '@/util/valtio-helper';

import type { PipelineTemplateType } from '../pipeline/pipeline-protocol';

import type {
  AtomicConfigNode,
  ComponentConfig,
  ConfigItem,
  StructConfigNode,
} from './component-config-protocol';
import { ComponentConfigRegistry } from './component-config-registry';
import { isAtomicConfigNode, isStructConfigNode } from './utils';

export class DefaultComponentConfigService extends Model {
  componentConfigSavedEmitter = new Emitter<ComponentConfig>();
  onConfigChanged = this.componentConfigSavedEmitter.on;

  quickConfigSavedEmitter = new Emitter<{ type: PipelineTemplateType; options: any }>();
  onQuickConfigSaved = this.quickConfigSavedEmitter.on;

  componentConfigRegistry = getModel(ComponentConfigRegistry);

  // flat the config tree
  getComponentConfig(graphNode: { name: string }) {
    const { name } = graphNode;

    const node = this.componentConfigRegistry.getComponentConfig(
      name,
    ) as StructConfigNode;
    const leaves: AtomicConfigNode[] = [];
    if (node && node?.children.length > 0) this.getLeavesInTree(node, leaves);

    return leaves;
  }

  isConfigNeeded(nodeName: string): boolean {
    const configNodes = this.getComponentConfig({
      name: nodeName,
    });
    if (configNodes.length === 0) return false;
    for (const configNode of configNodes) {
      if (isAtomicConfigNode(configNode, 'isRequired')) {
        if (!configNode.default_value) return true;
      }
    }
    return false;
  }

  private getLeavesInTree(root: ConfigItem, leaves: AtomicConfigNode[] = []): void {
    if (isStructConfigNode(root) && root.children.length > 0) {
      const selectedChildren = root.children;

      // if (root.selectedName) {
      //   selectedChildren = root.children.filter(
      //     (child) => child.name === (root as StructConfigNode).selectedName,
      //   );
      //   leaves.push(root);
      // }

      selectedChildren.map((c) => this.getLeavesInTree(c, leaves));
      return;
    }

    leaves.push(root as AtomicConfigNode);
    return;
  }

  saveComponentConfig(node: ComponentConfig) {
    this.componentConfigSavedEmitter.fire(node);
  }

  saveQuickConfig(config: { type: PipelineTemplateType; options: any }) {
    this.quickConfigSavedEmitter.fire(config);
  }
}
