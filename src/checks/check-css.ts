import type { CssStylesheetAST } from '@adobe/css-tools';

import {
  getMatchingAtRuleTitles,
  getMatchingFunctionTitles,
  getMatchingKeywordTitles,
  getMatchingPropertyTitles,
  getMatchingPropertyValuePairTitles,
  getMatchingPropertyValueTitles,
  getMatchingUnitTitles
} from '../css-titles.js';
import { type Position } from '../features.js';
import { getMatchingImageTitles, getUrlsFromCssValue } from '../image-titles.js';
import { getMatchingPseudoSelectorTitles, getMatchingSelectorTitles } from '../selectors.js';

import { type BaseCheckArgs, adjustPosition } from './check-base.js';
import { checkFeatures } from './check-features.js';

interface CheckDeclarationsArgs extends BaseCheckArgs {
  declarations: Array<{
    property: string;
    value: string;
    position?: Position;
  }>;
  offset?: {
    line: number;
    column: number;
  };
}

interface CheckSelectorsArgs extends BaseCheckArgs {
  selectors: string[];
  position?: Position;
  offset?: {
    line: number;
    column: number;
  };
}

interface CheckStylesheetArgs extends BaseCheckArgs {
  stylesheet: CssStylesheetAST;
  offset?: {
    line: number;
    column: number;
  };
}

const atRules = new Set([
  'charset',
  'custom-media',
  'document',
  'font-face',
  'host',
  'import',
  'keyframes',
  'keyframe',
  'media',
  'namespace',
  'page',
  'supports'
]);

export const checkDeclarations = ({
  clients,
  declarations,
  issues,
  offset
}: CheckDeclarationsArgs) => {
  for (const declaration of declarations) {
    const { property: propertyName, value: propertyValue, position } = declaration;
    const adjustedPosition = adjustPosition(position, offset);

    if (propertyName !== void 0) {
      const propertyTitles = getMatchingPropertyTitles({ propertyName });
      checkFeatures({ clients, issues, titles: propertyTitles, position: adjustedPosition });
    }

    if (propertyValue !== void 0) {
      const functionTitles = getMatchingFunctionTitles({ propertyValue });
      const keywordTitles = getMatchingKeywordTitles({ propertyValue });
      const propertyValueTitles = getMatchingPropertyValueTitles({ propertyValue });
      const unitTitles = getMatchingUnitTitles({ propertyValue });
      const imageTitles = getMatchingImageTitles({ urls: getUrlsFromCssValue(propertyValue) });

      checkFeatures({ clients, issues, titles: functionTitles, position: adjustedPosition });
      checkFeatures({ clients, issues, titles: keywordTitles, position: adjustedPosition });
      checkFeatures({ clients, issues, titles: propertyValueTitles, position: adjustedPosition });
      checkFeatures({ clients, issues, titles: unitTitles, position: adjustedPosition });
      checkFeatures({ clients, issues, titles: imageTitles, position: adjustedPosition });
    }

    if (propertyName !== void 0 && propertyValue !== void 0) {
      const propertyValuePairTitles = getMatchingPropertyValuePairTitles({
        propertyName,
        propertyValue
      });
      checkFeatures({
        clients,
        issues,
        titles: propertyValuePairTitles,
        position: adjustedPosition
      });
    }
  }
};

const checkSelectors = ({ clients, issues, selectors, position, offset }: CheckSelectorsArgs) => {
  const adjustedPosition = adjustPosition(position, offset);

  for (const selector of selectors) {
    if (selector.includes('&')) {
      checkFeatures({ clients, issues, titles: ['CSS Nesting'], position: adjustedPosition });
    }

    const pseudoSelectorTitles = getMatchingPseudoSelectorTitles({ selector });
    const selectorTitles = getMatchingSelectorTitles({ selector });

    checkFeatures({ clients, issues, titles: pseudoSelectorTitles, position: adjustedPosition });
    checkFeatures({ clients, issues, titles: selectorTitles, position: adjustedPosition });
  }
};

export const checkStylesheet = ({ clients, issues, stylesheet, offset }: CheckStylesheetArgs) => {
  const matchedAtRules: string[] = [];
  for (const stylesheetRule of stylesheet.stylesheet?.rules ?? []) {
    if (stylesheetRule.type === 'rule') {
      const rule = stylesheetRule;
      const cssCommentPositions = (rule.declarations ?? [])
        .filter((declaration) => declaration.type === 'comment')
        .map((declaration) => declaration.position)
        .filter((position) => position !== undefined);
      const declarations = (rule.declarations ?? [])
        .filter((declaration) => declaration.type !== 'comment')
        .map((declaration) => ({
          property: declaration.property,
          value: declaration.value,
          position: declaration.position ? { ...declaration.position } : undefined
        }));

      checkDeclarations({ clients, declarations, issues, offset });
      for (const position of cssCommentPositions) {
        checkFeatures({
          clients,
          issues,
          titles: ['CSS comments'],
          position: adjustPosition(position, offset)
        });
      }
      checkSelectors({
        clients,
        issues,
        selectors: rule.selectors ?? [],
        position: rule.position ? { ...rule.position } : undefined,
        offset
      });
    }

    if (stylesheetRule.type === 'comment') {
      checkFeatures({
        clients,
        issues,
        titles: ['CSS comments'],
        position: adjustPosition(stylesheetRule.position, offset)
      });
    }

    if (atRules.has(stylesheetRule.type)) {
      matchedAtRules.push(stylesheetRule.type);
    }
  }

  const atRuleTitles = getMatchingAtRuleTitles({ atRules: matchedAtRules });
  checkFeatures({ clients, issues, titles: atRuleTitles });
};
