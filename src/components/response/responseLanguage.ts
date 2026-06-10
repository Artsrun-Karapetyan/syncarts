export type ResponseLanguage = 'json' | 'xml' | 'html' | 'text';

const HTML_BODY_PATTERN = /^\s*(?:<!doctype\s+html|<html[\s>]|<head[\s>]|<body[\s>]|<style[\s>]|<script[\s>]|<pre[\s>]|<div[\s>])/i;
const DEBUG_DUMP_PATTERN = /(?:sf-dump|xdebug-var-dump|Whoops\\Exception)/i;

export function detectResponseLanguage(
  contentType: string,
  body: string | undefined,
  hasParsedJson: boolean
): ResponseLanguage {
  const normalizedContentType = contentType.toLowerCase();

  if (normalizedContentType.includes('html')) return 'html';
  if (normalizedContentType.includes('xml')) return 'xml';
  if (normalizedContentType.includes('json') || hasParsedJson) return 'json';

  const responseBody = body || '';
  if (HTML_BODY_PATTERN.test(responseBody) || DEBUG_DUMP_PATTERN.test(responseBody)) {
    return 'html';
  }

  return 'text';
}
