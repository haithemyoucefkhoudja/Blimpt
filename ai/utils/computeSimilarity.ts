import dot from "compute-dot";
import cosineSimilarity from "compute-cosine-similarity";

const computeSimilarity = (x: number[], y: number[]): number => {
  const similarityMeasure = "cosine";

  if (similarityMeasure === "cosine") {
    return cosineSimilarity(x, y) || 1;
  } else if (similarityMeasure === "dot") {
    return dot(x, y) || 1;
  }

  throw new Error("Invalid similarity measure");
};

export default computeSimilarity;
