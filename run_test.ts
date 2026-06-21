import { parseOpenApiCollection } from "./src/utils/openapi/openApiImportParser.ts";
const json = JSON.stringify({
  openapi: "3.0.0",
  info: { title: "Test", version: "1.0.0" },
  paths: {
    "/api": {
      post: {
        requestBody: {
          content: {
            "text/xml": {
              example: "<xml></xml>",
            },
          },
        },
      },
    },
  },
});
const result = parseOpenApiCollection(json);
// eslint-disable-next-line no-console
console.log(JSON.stringify(result.items, null, 2));
