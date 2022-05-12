import axios from "axios";

export default async () => {
  try {
    const { userAccessToken, projectId } = process.env;

    await axios.delete(`https://api.graphand.io/projects/${projectId}`, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    });
  } catch (e) {
    console.log(e);
    throw e;
  }
};
