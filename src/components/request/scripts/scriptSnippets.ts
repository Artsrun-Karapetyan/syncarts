export const SNIPPET_GROUPS = [
  {
    category: "Variables",
    items: [
      {
        name: "Get a global variable",
        code: 'pm.globals.get("variable_key");',
      },
      {
        name: "Get a collection variable",
        code: 'pm.collectionVariables.get("variable_key");',
      },
      {
        name: "Get an environment variable",
        code: 'pm.environment.get("variable_key");',
      },
      { name: "Get a variable", code: 'pm.variables.get("variable_key");' },
      {
        name: "Set a global variable",
        code: 'pm.globals.set("variable_key", "variable_value");',
      },
      {
        name: "Set a collection variable",
        code: 'pm.collectionVariables.set("variable_key", "variable_value");',
      },
      {
        name: "Set an environment variable",
        code: 'pm.environment.set("variable_key", "variable_value");',
      },
      {
        name: "Set a variable",
        code: 'pm.variables.set("variable_key", "variable_value");',
      },
      {
        name: "Clear a global variable",
        code: 'pm.globals.unset("variable_key");',
      },
      {
        name: "Clear a collection variable",
        code: 'pm.collectionVariables.unset("variable_key");',
      },
      {
        name: "Clear an environment variable",
        code: 'pm.environment.unset("variable_key");',
      },
      {
        name: "Clear a local variable",
        code: 'pm.variables.unset("variable_key");',
      },
    ],
  },
  {
    category: "Workflows",
    items: [
      {
        name: "Send an HTTP request",
        code: 'pm.sendRequest("https://postman-echo.com/get", function (err, response) {\n    console.log(response.json());\n});',
      },
      {
        name: "Send an HTTP request from a Collection",
        code: 'pm.sendRequest("https://postman-echo.com/get", function (err, response) {\n    console.log(response.json());\n});',
      },
    ],
  },
  {
    category: "Tests",
    items: [
      {
        name: "Status code: Code is 200",
        code: 'pm.test("Status code is 200", function () {\n    pm.response.to.have.status(200);\n});',
      },
      {
        name: "Response body: Contains string",
        code: 'pm.test("Body matches string", function () {\n    pm.expect(pm.response.text()).to.include("string_you_want_to_search");\n});',
      },
      {
        name: "Response body: JSON value check",
        code: 'var jsonData = pm.response.json();\npm.test("Your test name", function () {\n    pm.expect(jsonData.value).to.eql(100);\n});',
      },
      {
        name: "Response body: Is equal to a string",
        code: 'pm.test("Body is correct", function () {\n    pm.response.to.have.body("response_body_string");\n});',
      },
      {
        name: "Response headers: Content-Type header check",
        code: 'pm.test("Content-Type is present", function () {\n    pm.response.to.have.header("Content-Type");\n});',
      },
      {
        name: "Response time is less than 200ms",
        code: 'pm.test("Response time is less than 200ms", function () {\n    pm.expect(pm.response.responseTime).to.be.below(200);\n});',
      },
      {
        name: "Status code: Successful POST request",
        code: 'pm.test("Successful POST request", function () {\n    pm.expect(pm.response.code).to.be.oneOf([201, 202]);\n});',
      },
      {
        name: "Status code: Code name has string",
        code: 'pm.test("Status code name has string", function () {\n    pm.response.to.have.status("Created");\n});',
      },
      {
        name: "Response body: Convert XML body to a JSON Object",
        code: "var jsonObject = xml2Json(pm.response.text());\nconsole.log(jsonObject);",
      },
      {
        name: "Use Tiny Validator for JSON data",
        code: 'var schema = {\n    "items": {\n        "type": "boolean"\n    }\n};\n\nvar data1 = [true, false];\nvar data2 = [true, 123];\n\npm.test(\'Schema is valid\', function() {\n  pm.expect(tv4.validate(data1, schema)).to.be.true;\n  pm.expect(tv4.validate(data2, schema)).to.be.true;\n});',
      },
    ],
  },
];
