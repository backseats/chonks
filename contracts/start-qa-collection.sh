#!/bin/sh

#npm --prefix ../ts-tooling run qa-collection ../linepepen-render/ test/LinepepenManager.t.sol testSvgRenderer 0 1000
npm --prefix ./ts-tooling run qa-collection ../ test/ChonksMainRenderer.t.sol testSvgRenderer 1 330
