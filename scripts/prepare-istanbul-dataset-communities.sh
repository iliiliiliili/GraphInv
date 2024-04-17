cd ../src
node -r ts-node/register --max-old-space-size=600000 --max-semi-space-size=600000 prepare-istanbul-dataset.ts createCommunities