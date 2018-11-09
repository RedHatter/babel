import { declare } from "@babel/helper-plugin-utils";
import { types as t } from "@babel/core";

export default declare(api => {
  api.assertVersion(7);

  let baseId = false;

  return {
    manipulateOptions(opts, parserOpts) {
      parserOpts.plugins.push("cascadeOperator");
    },

    visitor: {
      CascadeBlock: {
        enter(path) {
          baseId = path.scope.generateUidIdentifier("obj");

          const body = path.node.body;
          body.push(t.returnStatement(baseId));

          const func = t.arrowFunctionExpression(
            [baseId],
            t.blockStatement(body),
          );
          func.extra = { parenthesized: true };

          path.replaceWith(t.callExpression(func, [path.node.object]));
        },
        exit() {
          baseId = false;
        },
      },

      CascadeMemberExpression(path) {
        if (!baseId) {
          throw path.buildCodeFrameError(
            "CascadeMemberExpression outside of CascadeBlock",
          );
        }

        path.replaceWith(t.memberExpression(baseId, path.node.property));
      },
    },
  };
});
