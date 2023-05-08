// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { BigNumberish, Wallet, providers, utils } from 'ethers'

type Data = {
    request: SignalRequest;
    proofData: string;
}
const walletSecretKey = process.env.P_KEY;
// const rpcUrl = `https://goerli.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`; // goerli
// const signatureVerifier = '0x933D2D7192C63DdAEFfe1793301A5d667C5d41b7'; // goerli

const rpcUrl = `https://polygon-mumbai.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`; // mumbai
const signatureVerifier = '0x1041eB121cD1b7200f7B352026b21A2D69f2f333'; // mumbai

if (!walletSecretKey || !rpcUrl) {
    throw new Error("Missing env variable");
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {

        const { destination, tokenId } = req.body;
        const claim = createClaim(tokenId, 1, "0x", "ipfs://dummyIpfsHash");
        const request = generateSignalRequest([claim], ["ipfs://dummyContentUri"], destination);
        const provider = new providers.JsonRpcProvider(rpcUrl);
        const signer = new Wallet(walletSecretKey!, provider);
        const proofData = await generateProofData(request, signer, signatureVerifier, 80001, "SignatureVerifier");
        return res.status(200).json({ request, proofData })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error });
    }
}

interface Claim {
    tokenId: BigNumberish;
    value: BigNumberish;
    extraData: string; // Use string if it's a hex string or Uint8Array if it's a byte array
    signalURI: string;
}

interface SignalRequest {
    claims: Claim[];
    contentURIs: string[];
    destination: string;
}


export const generateSignalRequest = (
    claims: Claim[],
    contentURIs: string[],
    destination: string
): SignalRequest => {
    return {
        claims,
        contentURIs,
        destination,
    };
};

export const createClaim = (
    tokenId: BigNumberish,
    value: BigNumberish,
    extraData: string,
    signalURI: string
): Claim => {
    return {
        tokenId,
        value,
        extraData,
        signalURI,
    };
};


export const generateProofData = async (
    request: SignalRequest,
    signer: Wallet,
    verifyingContract: string,
    chainId: number,
    domainName: string
): Promise<string> => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const deadline = Math.floor(tomorrow.getTime() / 1000);
    const signData = generateEIP712TypedSignData(
        request,
        verifyingContract,
        deadline,
        domainName,
        chainId
    );
    const sig = await signer._signTypedData(signData.domain, signData.types, signData.message);
    const { r, s, v } = utils.splitSignature(sig);
    return utils.defaultAbiCoder.encode(
        ["uint8", "bytes32", "bytes32", "uint256"],
        [v, r, s, deadline]
    );
};

export const generateEIP712TypedSignData = (
    signalRequest: SignalRequest,
    verifyingContract: string,
    deadline: string | number,
    domainName: string,
    chainId: number
  ) => {
    const claimsTuple = signalRequest.claims.map(claim => [
      claim.tokenId,
      claim.value,
      claim.extraData,
      claim.signalURI
    ]);
    return {
      primaryType: "SignalRequest",
      domain: {
        name: domainName,
        version: "1",
        chainId,
        verifyingContract,
      },
      types: {
        SignalRequest: [
          { name: "signalRequest", type: "bytes32" },
          { name: "deadline", type: "uint256" },
        ],
      },
      message: {
        signalRequest: utils.keccak256(
          utils.defaultAbiCoder.encode(
            ["tuple(uint256,uint256,bytes,string)[]", "string[]", "address"],
            [claimsTuple, signalRequest.contentURIs, signalRequest.destination]
          )
        ),
        deadline,
      },
    };
  };
