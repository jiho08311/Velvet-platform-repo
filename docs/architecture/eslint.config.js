// eslint.config.js
export default [
  {
    files: ["src/modules/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/modules/*/runtime/**",
                "@/modules/*/repositories/**",
                "@/modules/*/services/**"
              ],
              message:
                "Boundary Law: 다른 모듈의 runtime/repositories/services import 금지. public 또는 contracts를 사용하세요."
            }
          ]
        }
      ]
    }
  }
];