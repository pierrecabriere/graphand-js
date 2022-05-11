import axios from "axios";

export default async () => {
  try {
    const { userAccessToken, projectId } = process.env;

    await axios.delete(`http://api.graphand.io.local:1337/projects/${projectId}`, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    });
  } catch (e) {
    console.log(e);
    throw e;
  }
};
