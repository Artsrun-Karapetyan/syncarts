import JsonView from "@uiw/react-json-view";
import React from "react";

import { getShortcutLabel } from "@/components/response/json/jsonShortcut";

const URL_PATTERN = /^https?:\/\/\S+$/i;

export function JsonExtractWrappers() {
  const dispatchExtract = (e: React.MouseEvent, keys: any[], value: any) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent("json-extract-context-menu", {
        detail: {
          x: e.clientX,
          y: e.clientY,
          path: keys,
          value,
        },
      }),
    );
  };

  return (
    <>
      <JsonView.String
        render={(
          { children, className, ...rest }: any,
          { type, value, keys }: any,
        ) => {
          if (type !== "value" || typeof value !== "string") return undefined;

          const isUrl = URL_PATTERN.test(value);

          return (
            <>
              <span className="w-rjv-quotes">"</span>
              <span
                {...rest}
                className={`${className || ""} ${isUrl ? "response-json-link" : ""}`}
                data-url={isUrl ? value : undefined}
                data-tooltip={
                  isUrl
                    ? `Follow link (${getShortcutLabel()} + click)`
                    : undefined
                }
                title={
                  isUrl
                    ? `Follow link (${getShortcutLabel()} + click)`
                    : undefined
                }
                onContextMenu={(e: React.MouseEvent) => {
                  dispatchExtract(e, keys || [], value);
                }}
                style={{
                  ...rest.style,
                  cursor: isUrl ? "pointer" : "context-menu",
                }}
              >
                {children}
              </span>
              <span className="w-rjv-quotes">"</span>
            </>
          );
        }}
      />

      <JsonView.Int
        render={(
          { children, className, ...rest }: any,
          { type, value, keys }: any,
        ) => {
          if (type !== "value") return undefined;
          return (
            <span
              {...rest}
              className={className}
              onContextMenu={(e: React.MouseEvent) =>
                dispatchExtract(e, keys || [], value)
              }
              style={{ ...rest.style, cursor: "context-menu" }}
            >
              {children}
            </span>
          );
        }}
      />

      <JsonView.Float
        render={(
          { children, className, ...rest }: any,
          { type, value, keys }: any,
        ) => {
          if (type !== "value") return undefined;
          return (
            <span
              {...rest}
              className={className}
              onContextMenu={(e: React.MouseEvent) =>
                dispatchExtract(e, keys || [], value)
              }
              style={{ ...rest.style, cursor: "context-menu" }}
            >
              {children}
            </span>
          );
        }}
      />

      <JsonView.True
        render={(
          { children, className, ...rest }: any,
          { type, value, keys }: any,
        ) => {
          if (type !== "value") return undefined;
          return (
            <span
              {...rest}
              className={className}
              onContextMenu={(e: React.MouseEvent) =>
                dispatchExtract(e, keys || [], value)
              }
              style={{ ...rest.style, cursor: "context-menu" }}
            >
              {children}
            </span>
          );
        }}
      />

      <JsonView.False
        render={(
          { children, className, ...rest }: any,
          { type, value, keys }: any,
        ) => {
          if (type !== "value") return undefined;
          return (
            <span
              {...rest}
              className={className}
              onContextMenu={(e: React.MouseEvent) =>
                dispatchExtract(e, keys || [], value)
              }
              style={{ ...rest.style, cursor: "context-menu" }}
            >
              {children}
            </span>
          );
        }}
      />

      <JsonView.Null
        render={(
          { children, className, ...rest }: any,
          { type, value, keys }: any,
        ) => {
          if (type !== "value") return undefined;
          return (
            <span
              {...rest}
              className={className}
              onContextMenu={(e: React.MouseEvent) =>
                dispatchExtract(e, keys || [], value)
              }
              style={{ ...rest.style, cursor: "context-menu" }}
            >
              {children}
            </span>
          );
        }}
      />
      <JsonView.KeyName
        render={(
          { children, className, ...rest }: any,
          { keys, value }: any,
        ) => {
          return (
            <span
              {...rest}
              className={`${className || ""} w-rjv-object-key`.trim()}
              onContextMenu={(e: React.MouseEvent) => {
                if (keys && keys.length > 0) dispatchExtract(e, keys, value);
              }}
              style={{ ...rest.style, cursor: "context-menu" }}
            >
              {children}
            </span>
          );
        }}
      />
    </>
  );
}
