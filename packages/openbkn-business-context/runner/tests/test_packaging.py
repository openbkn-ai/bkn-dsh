from __future__ import annotations

import tomllib
import unittest
from pathlib import Path


class RunnerPackagingTests(unittest.TestCase):
    def test_allows_the_pinned_osdk_git_reference(self) -> None:
        pyproject = Path(__file__).resolve().parents[1] / "pyproject.toml"
        config = tomllib.loads(pyproject.read_text(encoding="utf-8"))

        self.assertTrue(config["tool"]["hatch"]["metadata"]["allow-direct-references"])


if __name__ == "__main__":
    unittest.main()
