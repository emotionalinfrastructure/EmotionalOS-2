from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="eios-sdk",
    version="1.0.1",
    author="Emotional Safety Commission",
    author_email="[email protected]",
    description="Emotional Infrastructure Operating System - Protect users' nervous systems in AI interactions",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/eios/sdk",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "License :: Other/Proprietary License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
    install_requires=[
        "numpy>=1.20.0",
        "orjson>=3.9.0",
        "PyNaCl>=1.5.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=3.0.0",
            "black>=22.0.0",
            "flake8>=4.0.0",
            "mypy>=0.950",
        ],
    },
    entry_points={
        "console_scripts": [
            "eios-validate=eios.cli:validate",
            "eios-test=eios.testing.stress_tester:main",
            "eios-export=eios.tools.export_cli:main",
        ],
    },
)
