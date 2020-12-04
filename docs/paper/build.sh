#!/bin/sh

pdflatex -file-line-error -interaction=nonstopmode -synctex=1 -output-format=pdf -output-directory=. chaos.tex
bibtex chaos
pdflatex -file-line-error -interaction=nonstopmode -synctex=1 -output-format=pdf -output-directory=. chaos.tex
pdflatex -file-line-error -interaction=nonstopmode -synctex=1 -output-format=pdf -output-directory=. chaos.tex
