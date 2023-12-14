import React, { useEffect } from "react";
import { contractAddress, abi } from '../../utils/web3/contract';
import { addressProof } from '../../utils/web3/merkleTree';
import {toast} from "react-toastify"

const { ethers } = require('ethers');


export default function MintButton() {

//   let ethereum;
  let supplyCount = 26;

//   useEffect(() => {
//     ethereum = window.ethereum;
//   });


  const contractData = async () => {
    
    if (window.ethereum) {
      if (window.ethereum.selectedAddress == null) {
        toast.error("Oops! your wallet is not connected!");
        return [];
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);

      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      const address = accounts[0]

      return [contract, address, provider];
    } else {
      toast.error("Metamask is not installed!");
      return [];
    }
  };

  const totalSupply = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      // const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, provider);

      const count = await contract.totalSupply();
      return parseInt(count);
    } else return supplyCount;
  };

   const verify = async (accounts) => {
    const proof = await addressProof(accounts);
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, abi, provider);

    const status = await contract.verifyWhitelist(accounts, proof);

    return status;
  };

   const _claimStatus = async (accounts) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    // const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, provider);

    const status = await contract.checkMintStatus(accounts);
    return status;
  };

   const Mint = async () => {
    
    const data = await contractData();

    if (data.length === 0) return;

    const contract = data[0];

    const address = data[1];

    const proof = await addressProof(address);

    let status = await verify(address);
    let claimStat = await _claimStatus(address);
    let supply = await totalSupply();

    try {
      if (!status) {
        toast.error("You are not Eligible!");
        return;
      }

      if (claimStat) {
        toast.warn("You have already claimed!");
        return;
      }

      if (supply > 786) {
        toast.error("Oops! We are out of stock.");
        return;
      }

      toast.loading("Transaction is under process...");

      const transactionResponse = await contract.whitelistMint(proof, {
        value: ethers.parseEther("0.2"),
      });

      return transactionResponse
        .wait(1)
        .then(() => {
          toast.dismiss();
          toast.success("Transaction Done!");
          supplyCount++;
          return transactionResponse.hash;
        })
        .catch((err) => {
          toast.dismiss();
          toast.error("Something goes wrong!");
          console.log(err);
          return;
        });
    } catch (error) {
      toast.dismiss();
      toast.error("Something went wrong.");
      console.log(error);
    }
  };



  return (
    <button
      onClick={() => Mint()}
      class="text-gray-100 background-opacity-75 hover:bg-gray-900 border border-gray-400 focus:ring-2 focus:outline-none font-medium rounded-md text-xl px-4 py-2 flex items-center"
    >
      <svg
        class="w-4 h-4 me-2 -ms-1 text-[#626890]"
        aria-hidden="true"
        focusable="false"
        data-prefix="fab"
        data-icon="ethereum"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 320 512"
      >
        <path
          fill="currentColor"
          d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z"
        ></path>
      </svg>
      Mint Now
    </button>
  );
}
