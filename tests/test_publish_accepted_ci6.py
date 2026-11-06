import hashlib
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('accepted', Path(__file__).parents[1] / 'scripts/publish-accepted-ci6.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


class AcceptedReleaseTests(unittest.TestCase):
    def receipt(self):
        return dict(status='PASS', candidate_sha256=m.SHA, candidate_source=m.SOURCE,
                    platform='0.2.1', cli='0.2.1', mac_native=True, windows_native=True,
                    platform_origin='https://192.168.50.129', evidence_files=[{'path': 'docs/evidence/report'}])

    def run_artifact(self):
        return (dict(id=m.RUN, status='completed', conclusion='success', event='workflow_dispatch',
                     head_sha=m.SOURCE, head_repository={'full_name': m.REPO},
                     path='.github/workflows/release-plugin.yml'),
                dict(id=m.ARTIFACT, name='plugin-tarball', expired=False,
                     workflow_run={'id': m.RUN, 'head_sha': m.SOURCE}))

    def test_formal_both_hosts_accepted(self):
        m.validate_receipt(self.receipt())

    def test_missing_native_form_or_partial_is_refused(self):
        for field, value in [('status', 'PARTIAL'), ('mac_native', False), ('windows_native', False),
                             ('windows_native', 'true'), ('evidence_files', [])]:
            with self.subTest(field=field), self.assertRaises(ValueError):
                d = self.receipt(); d[field] = value; m.validate_receipt(d)

    def test_prerelease_or_wrong_origin_refused(self):
        for field, value in [('cli', '0.2.1-rc.2'), ('platform', '0.2.1-main'),
                             ('platform_origin', 'https://192.168.50.28')]:
            with self.subTest(field=field), self.assertRaises(ValueError):
                d = self.receipt(); d[field] = value; m.validate_receipt(d)

    def test_different_candidate_refused(self):
        for field in ['candidate_sha256', 'candidate_source']:
            with self.subTest(field=field), self.assertRaises(ValueError):
                d = self.receipt(); d[field] = '0' * 64; m.validate_receipt(d)

    def test_origin_accepted(self):
        m.validate_origin(*self.run_artifact())

    def test_failed_foreign_or_unfinished_run_refused(self):
        for field, value in [('conclusion', 'failure'), ('status', 'in_progress'),
                             ('event', 'pull_request'), ('head_sha', 'wrong'),
                             ('head_repository', {'full_name': 'foreign/repo'}), ('path', 'other.yml')]:
            with self.subTest(field=field), self.assertRaises(ValueError):
                r, a = self.run_artifact(); r[field] = value; m.validate_origin(r, a)

    def test_wrong_expired_or_cross_run_artifact_refused(self):
        for field, value in [('expired', True), ('id', 1), ('name', 'other'),
                             ('workflow_run', {'id': 1, 'head_sha': m.SOURCE})]:
            with self.subTest(field=field), self.assertRaises(ValueError):
                r, a = self.run_artifact(); a[field] = value; m.validate_origin(r, a)

    def test_altered_archive_refused_before_tar_parsing(self):
        with self.assertRaisesRegex(ValueError, 'byte mismatch'):
            m.validate_archive(b'x' * 877732)

    def test_only_reviewed_promotion_plumbing_and_docs_can_differ(self):
        m.validate_source_changes(['docs/evidence/report.json', 'CLAUDE.md',
                                   'scripts/publish-accepted-ci6.py', 'README.md', 'CHANGELOG.md'])
        for path in ['packages/openbkn-business-context/src/auth.ts', 'pnpm-lock.yaml',
                     '.npmrc', '.github/workflows/other.yml', 'scripts/build.mjs']:
            with self.subTest(path=path), self.assertRaises(ValueError):
                m.validate_source_changes(['docs/report.md', path])

    def test_both_latest_promotions_are_separate(self):
        text = (Path(__file__).parents[1] / 'scripts/publish-accepted-ci6.py').read_text()
        self.assertIn("'--latest=false'", text)
        self.assertNotIn("'dist-tag', 'add'", text)
        self.assertNotIn("'--latest',", text)

    def test_workflow_never_combines_rebuild_with_promotion(self):
        text = (Path(__file__).parents[1] / '.github/workflows/release-plugin.yml').read_text()
        self.assertIn('if: ${{ !inputs.publish_accepted_ci6 }}', text)
        job = text.split('  publish-accepted-ci6:')[1]
        self.assertIn("github.ref == 'refs/heads/main'", job)
        self.assertIn('inputs.publish && inputs.publish_accepted_ci6', job)
        for forbidden in ['pnpm ', 'runtime:build', 'npm test', 'node --test']:
            self.assertNotIn(forbidden, job)


if __name__ == '__main__':
    unittest.main()
