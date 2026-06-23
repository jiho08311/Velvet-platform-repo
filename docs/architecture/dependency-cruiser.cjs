// .dependency-cruiser.cjs
module.exports = {
  forbidden: [
    {
      name: "no-cross-module-runtime-import",
      severity: "error",
      from: {
        path: "^src/modules/([^/]+)/",
        pathNot: "^src/modules/$1/"
      },
      to: {
        path: "^src/modules/([^/]+)/runtime/"
      }
    },
    {
      name: "no-cross-module-repositories-import",
      severity: "error",
      from: {
        path: "^src/modules/([^/]+)/",
        pathNot: "^src/modules/$1/"
      },
      to: {
        path: "^src/modules/([^/]+)/repositories/"
      }
    },
    {
      name: "no-cross-module-services-import",
      severity: "error",
      from: {
        path: "^src/modules/([^/]+)/",
        pathNot: "^src/modules/$1/"
      },
      to: {
        path: "^src/modules/([^/]+)/services/"
      }
    },
    {
      name: "cross-module-import-only-via-public-or-contracts",
      severity: "error",
      from: {
        path: "^src/modules/([^/]+)/"
      },
      to: {
        path: "^src/modules/(?!$1/)([^/]+)/(?!public(?:/|$)).+"
      }
    }
  ],
  options: {
    tsPreCompilationDeps: true,
    doNotFollow: {
      path: "node_modules"
    }
  }
};