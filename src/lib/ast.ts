import { Project, SyntaxKind, QuoteKind } from "ts-morph";
import path from "path";
import fs from "fs-extra";

export async function addProviderToLayout(projectPath: string) {
  const layoutPath = path.join(projectPath, "src/app/layout.tsx");

  if (!fs.existsSync(layoutPath)) return;

  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(layoutPath);

  // 1. Add Import
  const hasImport = sourceFile.getImportDeclaration(
    (decl) => decl.getModuleSpecifierValue() === "@/components/providers"
  );

  if (!hasImport) {
    sourceFile.addImportDeclaration({
      namedImports: ["Providers"],
      moduleSpecifier: "@/components/providers",
    });
  }

  // 2. Wrap children in Providers
  // Looking for: export default function RootLayout({ children }: ... ) { return ( ... {children} ... ) }
  // We need to find the JSX Element that contains {children} or rather, usually we wrap the content of <body>

  // A common pattern in Next.js layout:
  // <html lang="en">
  //   <body className={inter.className}>{children}</body>
  // </html>

  // We want:
  // <body className={inter.className}><Providers>{children}</Providers></body>

  const exportDefault = sourceFile.getDefaultExportSymbol();
  if (exportDefault) {
    const funcDecl = sourceFile.getFunction(
      exportDefault.getName() || "RootLayout"
    ); // Often unnamed default, need to handle that.
    // Actually sourceFile.getDefaultExportSymbol() returns symbol.
    // sourceFile.getExportedDeclarations() might be better or finding the function that is default exported.
  }

  // Simpler approach for default export function:
  const defaultExport =
    sourceFile.getClasses().find((c) => c.isDefaultExport()) ||
    sourceFile.getFunctions().find((f) => f.isDefaultExport());

  if (defaultExport && defaultExport.getKindName() === "FunctionDeclaration") {
    const func = defaultExport.asKind(SyntaxKind.FunctionDeclaration);
    const body = func?.getBody()?.asKind(SyntaxKind.Block);
    if (body) {
      const returnStmt = body
        .getStatements()
        .find((s) => SyntaxKind.ReturnStatement === s.getKind());

      if (returnStmt) {
        // This is getting complex to manipulate JSX safely via AST without messing up formatting heavily.
        // However, we just need to replace `{children}` with `<Providers>{children}</Providers>`
        // IF it is inside the Body... or just wrap the inner-most use.

        // Let's use a slightly more robust text replacement scoped to the function if AST manipulation of JSX is too verbose.
        // BUT the goal IS AST.

        // Let's try to find the JsExpression `{children}`
        func?.forEachDescendant((node) => {
          if (node.getKind() === SyntaxKind.JsxExpression) {
            const text = node.getText();
            if (text === "{children}") {
              // Check parent to ensure we are not already wrapped?
              // Replace it.
              // Note: replaceWithText might be risky if there are multiple {children}?
              // Usually only one in RootLayout.
              node.replaceWithText("<Providers>{children}</Providers>");
            }
          }
        });
      }
    }
  }

  await sourceFile.save();
}

export async function configureTailwindForHeroUI(projectPath: string) {
  const configPath = path.join(projectPath, "tailwind.config.ts");
  if (!fs.existsSync(configPath)) return;

  const project = new Project({
    manipulationSettings: {
      quoteKind: QuoteKind.Double,
    },
  });
  const sourceFile = project.addSourceFileAtPath(configPath);

  // 1. Add Import
  // import {heroui} from '@heroui/react';
  const herouiImport = sourceFile.getImportDeclaration(
    (decl) => decl.getModuleSpecifierValue() === "@heroui/react"
  );

  if (!herouiImport) {
    sourceFile.addImportDeclaration({
      namedImports: ["heroui"],
      moduleSpecifier: "@heroui/react",
    });
  }

  // 2. Add Plugin
  // plugins: [heroui()]
  const defaultExport = sourceFile.getExportAssignment(
    (d) => !d.isExportEquals()
  );
  if (defaultExport) {
    // We expect `export default config;` and `const config: Config = { ... }`
    // Or `export default { ... }`

    // Let's look for the variable declaration 'config' if it exists.
    const configVar = sourceFile.getVariableDeclaration("config");
    if (configVar) {
      const initializer = configVar.getInitializerIfKind(
        SyntaxKind.ObjectLiteralExpression
      );
      if (initializer) {
        // Handle Plugins
        const pluginsProp = initializer.getProperty("plugins");
        if (
          pluginsProp &&
          pluginsProp.getKind() === SyntaxKind.PropertyAssignment
        ) {
          const array = pluginsProp
            .asKind(SyntaxKind.PropertyAssignment)
            ?.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression);
          if (array) {
            // Check if heroui() exists
            const hasPlugin = array
              .getElements()
              .some((e) => e.getText().includes("heroui()"));
            if (!hasPlugin) {
              array.addElement("heroui()");
            }
          }
        } else {
          // create plugins prop
          initializer.addPropertyAssignment({
            name: "plugins",
            initializer: "[heroui()]",
          });
        }

        // Handle Content
        const contentProp = initializer.getProperty("content");
        if (
          contentProp &&
          contentProp.getKind() === SyntaxKind.PropertyAssignment
        ) {
          const array = contentProp
            .asKind(SyntaxKind.PropertyAssignment)
            ?.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression);
          if (array) {
            const hasTheme = array
              .getElements()
              .some((e) => e.getText().includes("@heroui/theme"));
            if (!hasTheme) {
              array.addElement(
                `"./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"`
              );
            }
          }
        }
      }
    }
  }

  await sourceFile.save();
}

export async function configureGlobalCssForHeroUI(projectPath: string) {
  const cssPath = path.join(projectPath, "src/app/globals.css");
  if (!fs.existsSync(cssPath)) return;

  let content = await fs.readFile(cssPath, "utf-8");

  // Check if it's already configured to avoid duplication
  if (content.includes("@plugin './hero.ts';")) return;

  // Replace default tailwind import with v4 setup
  // We assume standard create-next-app output which usually starts with directives
  // Or just prepend/replace the top part.

  const v4Setup = `@import "tailwindcss";
@plugin './hero.ts';
@source '../../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}';
@custom-variant dark (&:is(.dark *));

`;

  if (content.includes('@import "tailwindcss";')) {
    content = content.replace('@import "tailwindcss";', v4Setup);
  } else {
    // Fallback: Prepend if no standard import found (though unlikely in fresh v4 app)
    content = v4Setup + content;
  }

  await fs.writeFile(cssPath, content);
}
