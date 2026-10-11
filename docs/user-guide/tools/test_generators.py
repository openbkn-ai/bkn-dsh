"""End-to-end generator regressions; run with GUIDE_TEST_FONT for Chinese PDFs."""
import copy
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

TOOLS = Path(__file__).resolve().parent
GUIDE = TOOLS.parent
spec = importlib.util.spec_from_file_location('guide_content', TOOLS/'guide_content.py')
content = importlib.util.module_from_spec(spec)
spec.loader.exec_module(content)


class AssignmentTests(unittest.TestCase):
    def test_default_covers_added_and_removed_steps_and_figures(self):
        for figures in range(1, 7):
            for steps in range(12):
                section = dict(id='install', steps=list(range(steps)), figures=[None]*figures)
                actual = content.figure_step_groups(section)
                self.assertEqual([i for group in actual for i in group], list(range(steps)))
                self.assertEqual(len(actual), figures)

    def test_explicit_groups_reject_omissions_duplicates_and_stale_indices(self):
        section = dict(id='install', steps=['one', 'two'], figures=[None, None])
        for groups in ([[0], []], [[0], [0, 1]], [[0], [2]], [[0, 1]], [[False], [1]], ['bad', [1]]):
            with self.subTest(groups=groups), self.assertRaises(ValueError):
                content.figure_step_groups(dict(section, step_groups=groups))
        self.assertEqual(content.figure_step_groups(dict(section, step_groups=[[0], [1]])), [[0], [1]])

    def test_no_figures_retains_text_and_rejects_stale_groups(self):
        section = dict(id='text', steps=['one'], figures=[])
        self.assertEqual(content.figure_step_groups(section), [])
        with self.assertRaises(ValueError):
            content.figure_step_groups(dict(section, step_groups=[[0]]))


@unittest.skipUnless(os.environ.get('GUIDE_TEST_FONT'), 'Set GUIDE_TEST_FONT to a Chinese TrueType font')
class GeneratorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='guide-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)/('手册 fixture' if os.name=='nt' else 'guide fixture')
        self.root.mkdir()
        (self.root/'images').mkdir()
        self.env = dict(os.environ, PYTHONUTF8='0', PYTHONCOERCECLOCALE='0',
                        LC_ALL='C', PYTHONIOENCODING='utf-8')

    def run_tool(self, name, *args, success=True):
        result = subprocess.run([sys.executable, str(TOOLS/name), '--guide-dir', str(self.root), *args],
                                env=self.env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if success:
            self.assertEqual(result.returncode, 0, result.stderr.decode('utf-8', errors='replace'))
        else:
            self.assertNotEqual(result.returncode, 0)
        return result

    def fixture(self, figures, steps, groups=None):
        from PIL import Image
        ss = [dict(id='install', title='中文标题', intro='中文介绍 IntroMarker',
                   steps=[f'StepMarker{i:03d} 中文操作' for i in range(steps)],
                   figures=[], note='中文提示 NoteMarker')]
        for i in range(figures):
            name=f'figure{i}.png'
            Image.new('RGB', (640, 240), (180+i, 230, 220)).save(self.root/'images'/name)
            ss[0]['figures'].append([name, f'中文截图 CaptionMarker{i:03d}', [[1, 20, 20, '点击这里']]])
        if groups is not None:
            ss[0]['step_groups']=groups
        self.write_sources(ss)
        return ss

    def write_sources(self, ss):
        for lang in ['zh', 'en']:
            (self.root/f'content.{lang}.json').write_text(json.dumps(ss, ensure_ascii=False), encoding='utf-8')

    def generate(self):
        self.run_tool('build.py')
        self.run_tool('export_pdf.py', '--font', os.environ['GUIDE_TEST_FONT'])
        self.run_tool('check.py')

    def test_non_utf8_locale_and_content_changes_keep_every_step_and_note(self):
        from pypdf import PdfReader
        for figures, steps, groups in [(4, 7, None), (1, 3, None), (0, 5, None), (3, 0, None), (2, 3, [[0], [1, 2]])]:
            with self.subTest(figures=figures, steps=steps):
                self.fixture(figures, steps, groups)
                self.generate()
                reader=PdfReader(self.root/'bkn-dsh-9-user-guide.zh.pdf')
                text='\n'.join(p.extract_text() for p in reader.pages)
                self.assertIn('中文标题', text)
                for token in ['IntroMarker', 'NoteMarker']+[f'StepMarker{i:03d}' for i in range(steps)]+[f'CaptionMarker{i:03d}' for i in range(figures)]:
                    self.assertEqual(text.count(token), 1, token)
                    for lang in ['zh', 'en']:
                        for suffix in ['md', 'html']:
                            path=self.root/(f'README.{lang}.md' if suffix=='md' else f'guide.{lang}.html')
                            self.assertIn(token, path.read_text(encoding='utf-8'))
                image_pages=[p for p in reader.pages if p.images]
                self.assertEqual(sum(len(p.images) for p in image_pages), figures)
                for page in image_pages:
                    self.assertIn('CaptionMarker', page.extract_text())

    def test_invalid_assignments_leave_existing_outputs_untouched(self):
        self.fixture(2, 3, [[0], [1]])
        outputs=['README.zh.md', 'guide.zh.html', 'bkn-dsh-9-user-guide.zh.pdf']
        for name in outputs:(self.root/name).write_bytes(b'existing output')
        for name, args in [('build.py', []), ('export_pdf.py', ['--font', os.environ['GUIDE_TEST_FONT']])]:
            result=self.run_tool(name, *args, success=False)
            self.assertIn(b'cover every step exactly once', result.stderr)
        for name in outputs:self.assertEqual((self.root/name).read_bytes(), b'existing output')

    def test_current_guide_stays_21_pages_with_all_images_and_bookmarks(self):
        from pypdf import PdfReader
        for lang in ['zh', 'en']:
            shutil.copyfile(GUIDE/f'content.{lang}.json', self.root/f'content.{lang}.json')
        shutil.copytree(GUIDE/'images', self.root/'images', dirs_exist_ok=True)
        self.generate()
        reader=PdfReader(self.root/'bkn-dsh-9-user-guide.zh.pdf')
        self.assertEqual(len(reader.pages), 21)
        self.assertEqual(len(reader.outline), 14)
        self.assertEqual(sum(len(p.images) for p in reader.pages), 19)
        self.assertIn('19 张', reader.pages[0].extract_text())
        for destination in reader.outline:
            self.assertGreater(reader.get_destination_page_number(destination), 0)

    def test_importing_cli_scripts_has_no_side_effects(self):
        result=subprocess.run([sys.executable, '-c',
            'import runpy,sys;sys.path.insert(0,sys.argv[1]);[runpy.run_path(p) for p in sys.argv[2:]]',
            str(TOOLS), *[str(TOOLS/name) for name in ['build.py', 'check.py', 'export_pdf.py']]],
            cwd=self.root, env=self.env, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(list(self.root.iterdir()), [self.root/'images'])


if __name__=='__main__':
    unittest.main()
