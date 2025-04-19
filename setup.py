from setuptools import setup, find_packages

setup(
    name="valorant-sim",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "uvicorn",
        "pydantic",
        "sqlalchemy",
        "psycopg2-binary",
    ],
    author="Your Name",
    author_email="your.email@example.com",
    description="A Valorant team simulation game",
    keywords="valorant, simulation, game",
    python_requires=">=3.8",
) 