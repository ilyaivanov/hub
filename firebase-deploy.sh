#!/bin/sh

echo "Removing all files from ../slapstuk/build"
rm -r ../slapstuk/build
npm run build
echo "Copying files to ../slapstuk folder..."
cp -r ./build  ../slapstuk
echo "Running 'firebase deploy --only hosting' from ../slapstuk folder..."
pushd ../slapstuk
firebase deploy --only hosting -P tubeflowy
popd
echo "Deploy to Slapstuk hosting done."