import { describe, it, expect } from 'vitest';
import { parseCsv, groupIntoTestCases } from './csvImport';

describe('parseCsv', () => {
  it('parses simple rows', () => {
    const csv = 'Título,Ação,Resultado Esperado\nLogin,Clicar em Entrar,Login realizado';
    const result = parseCsv(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.Título).toBe('Login');
    expect(result.rows[0]?.Ação).toBe('Clicar em Entrar');
  });

  it('handles quoted cells with commas', () => {
    const csv =
      'Título,Ação,Resultado Esperado\n"Login, fluxo","Preencher email","Login ok"';
    const result = parseCsv(csv);
    expect(result.rows[0]?.Título).toBe('Login, fluxo');
  });

  it('escapes double quotes', () => {
    const csv = 'Título,Ação,Resultado Esperado\nX,"Dizer ""oi""","OK"';
    const result = parseCsv(csv);
    expect(result.rows[0]?.Ação).toBe('Dizer "oi"');
  });

  it('reports missing required headers', () => {
    const csv = 'Foo,Bar\n1,2';
    const result = parseCsv(csv);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]?.message).toContain('Cabeçalhos faltando');
  });

  it('strips BOM', () => {
    const csv = '﻿Título,Ação,Resultado Esperado\nX,Y,Z';
    const result = parseCsv(csv);
    expect(result.rows).toHaveLength(1);
  });

  it('handles CRLF line endings', () => {
    const csv = 'Título,Ação,Resultado Esperado\r\nX,Y,Z\r\nA,B,C';
    const result = parseCsv(csv);
    expect(result.rows).toHaveLength(2);
  });

  it('reports invalid rows with line numbers', () => {
    const csv = 'Título,Ação,Resultado Esperado\nX,Y,Z\n,,';
    const result = parseCsv(csv);
    expect(result.rows).toHaveLength(1);
    expect(result.errors[0]?.line).toBe(3);
  });
});

describe('groupIntoTestCases', () => {
  it('groups multiple steps under same ID', () => {
    const csv =
      'ID,Título,Ação,Resultado Esperado\nT1,Login,Step 1,A1\nT1,Login,Step 2,A2';
    const { rows } = parseCsv(csv);
    const groups = groupIntoTestCases(rows);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.versions[0]?.steps).toHaveLength(2);
  });

  it('creates separate groups per ID', () => {
    const csv =
      'ID,Título,Ação,Resultado Esperado\nT1,A,X,1\nT2,B,Y,2';
    const { rows } = parseCsv(csv);
    const groups = groupIntoTestCases(rows);
    expect(groups).toHaveLength(2);
  });
});
