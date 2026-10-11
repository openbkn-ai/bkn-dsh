# bkn-dsh illustrated user guide

[English guide](README.en.md) · [中文手册](README.zh.md)

Read either Markdown guide directly on GitHub. Both editions cover installation, platform configuration, CLI setup, browser sign-in, network/workspace binding, supply-chain Q&A, execution provenance, business context graph, evidence receipts, continuing conversations, diagnostics, and troubleshooting.

- Download [English HTML](guide.en.html) or [中文 HTML](guide.zh.html) using GitHub’s **Download raw file** action, then open it in a browser. Each HTML embeds all 19 numbered screenshots and works offline. Download both files into the same folder to use the language switch.
- Download the [compact Chinese PDF](bkn-dsh-9-user-guide.zh.pdf) for sharing. It has 21 pages, clickable contents, bookmarks, and each screenshot beside its associated steps. The page size is 210 × 261 mm; use “fit to page” when printing on A4.
- Screenshots use the Chinese DSH UI. English prose includes the Chinese control names. Account labels, platform addresses, local paths and execution identifiers use examples. Other displayed values are from the recorded sample run, not a simulated successful response.

## Recorded environment and scope

Captured on 2026-10-11 with official macOS DSH 0.2.0-rc.2 and the accepted plugin -9 CI candidate (SHA-256 `dd2d50a2fdda8e55f1ff355b6121113fc6106aeeb6664463bc218cb9b366c887`). The -9 release is now published; the guide points to its fixed installation version. A candidate tarball digest is not the digest of the differently packed published npm tarball.

The sample network is `supply_ontology_hand`. Substitute your deployment URL and workspace folder. A real turn and all three provenance panes were captured. Installation form filling is illustrative; no reinstall was submitted during collection. Independent verification of every receipt, full-population statistics, and Windows UI were not part of this capture. Passive diagnostics are not active end-to-end tests, and a completed turn is not an answer-correctness guarantee.

## Maintaining the guide

`content.zh.json` and `content.en.json` are matching section sources; `images/` contains the numbered document screenshots shared by both languages. Do not translate or invent platform results inside screenshots.

```bash
python3 docs/user-guide/tools/build.py
python3 docs/user-guide/tools/check.py
```

The HTML/Markdown builder uses only the Python standard library. To regenerate the PDF, install ReportLab and Pillow and supply a TrueType font containing Chinese glyphs:

```bash
python3 docs/user-guide/tools/export_pdf.py --font /path/to/chinese-font.ttf
```

Inspect rendered pages after changing PDF layout or text; the automated checks do not establish visual correctness. Raw credentials, local diagnostic exports, and capture-session logs are not inputs to this public guide.

## Sample provenance

The displayed purchase-order examples come from the public, sanitized [supply-chain sample](https://github.com/openbkn-ai/bkn-samples/tree/7b5b59ca106d4d563cfcc03ffc85b2e3c3b7d9f6/samples/supply_ontology_hand), whose README states that it does not use customer production data. Order lines `31604` / `31606` and material `725-000274` match its [purchase-order CSV](https://github.com/openbkn-ai/bkn-samples/blob/7b5b59ca106d4d563cfcc03ffc85b2e3c3b7d9f6/samples/supply_ontology_hand/data/erp_purchase_order.csv). Its Git blob SHA `4f0691db5caa2bf70bccf0a241fd1f8773fa0550` was compared with the public GitHub file. The HTML embeds only the prepared, numbered public screenshot PNGs; original capture files and diagnostic JSON are not committed.

### Cross-platform generator maintenance

All content and generated text use UTF-8 explicitly; Python 3.10+ is required. On Windows, pass a Chinese TrueType font path, for example `--font "C:\Windows\Fonts\simhei.ttf"` if that font is installed. Fonts must contain Chinese glyphs; a `.ttc` collection or an outline format unsupported by ReportLab is not interchangeable with a `.ttf` file.

For sections with figures, optional `step_groups` assigns zero-based step indices to each figure in order. For example, `[[0], [1, 2]]` assigns step 1 to the first screenshot and steps 2–3 to the second. Every step must occur exactly once and there must be one group per figure. After editing steps or screenshots, update the groups in both languages or remove `step_groups` to distribute all steps automatically in contiguous, balanced groups. Invalid assignments fail before writing output, rather than silently omitting content. Text-only sections retain all steps and notes. Section/screenshot counts are derived from the content sources.

The PDF exporter keeps contents pagination in memory, uses private temporary output, and only publishes the completed file. Concurrent exports do not share a contents-cache file. Use `--guide-dir` to build/check fixture content and PDF `--output` to generate a preview without replacing the approved PDF.

```bash
python -m pip install -r docs/user-guide/tools/requirements-test.txt
# Set GUIDE_TEST_FONT to a Chinese .ttf path, then run:
python docs/user-guide/tools/test_generators.py
```

The `User guide generators` workflow runs the same regression suite and full 21-page generation on Windows and Linux with UTF-8 mode disabled. Its font is pinned to an upstream commit and SHA-256. Tests cover changed figure/step counts, missing/duplicate/stale assignments, Chinese text, text-only notes, CLI import safety, and the current guide's images/bookmarks. Download the generated PDF artifacts for visual checks; tests cannot establish visual correctness by themselves.
