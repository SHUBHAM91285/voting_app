const express = require('express');
const router = express.Router();
const User = require('./../models/user');
const Candidate = require('./../models/candidate');
const {jwtAuthMiddleware} = require('./../jwt');

const checkAdminRole = async(userID)=>{
    try{
        const user = await User.findById(userID)
        if(user.role === 'admin'){
            return true
        }
    }catch(err){
        return false
    }
}

router.post('/',jwtAuthMiddleware,async(req,res)=>{
    try{
        if(!await checkAdminRole(req.user.id))
            return res.status(403).json({message: "user doesn't have admin role"})

        const data = req.body
        const newCandidate = new Candidate(data);
        const response = await newCandidate.save();
        console.log('data saved');
        res.status(200).json({response: response});
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Internal Server error"});
    }
})

router.put('/:candidateID',jwtAuthMiddleware,async (req,res)=>{
    try{
        if(! await checkAdminRole(req.user.id))
            return res.status(403).json({message: "user doesn't have admin role"})
        const candidateID = req.params.candidateID
        const updatedCandidateData = req.body

        const response = await Candidate.findByIdAndUpdate(candidateID,updatedCandidateData,{
            new: true,//Return the updated document
            runValidators: true,//Run mongoose validation
        });

        if(!response){
            return res.status(404).json({error:'Candidate not found'})
        }
        console.log('candidate data updated');
        res.status(200).json(response);
    
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Internal Server error"});
    }
})

router.delete('/:candidateID',jwtAuthMiddleware,async (req,res)=>{
    try{
        if(! await checkAdminRole(req.user.id))
            return res.status(403).json({message: "user doesn't have admin role"})
        const candidateId = req.params.candidateID
        
        const response = await Candidate.findByIdAndDelete(candidateId);

        if(!response){
            return res.status(404).json({error:'Candidate not found'})
        }
        console.log('candidate deleted');
        res.status(200).json(response);
    
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Internal Server error"});
    }
})

router.post('/vote/:candidateID',jwtAuthMiddleware,async(req,res)=>{
    //no admin can vote
    //user can vote only once

    const candidateID = req.params.candidateID
    const userId = req.user.id
    try{
        const candidate = await Candidate.findById(candidateID)
        if(!candidate){
            return res.status(404).json({message:"Candidate not found"})
        }

        const user = await User.findById(userId)
        if(!user){
            return res.status(404).json({message:"User not found"})
        }

        if(user.isVoted){
            return res.status(400).json({message:"You have already voted"})
        }

        if(user.role == 'admin'){
            return res.status(403).json({message:"Admin is not allowed to vote"})
        }

        candidate.votes.push({user:userId})
        candidate.voteCount++
        await candidate.save()

        user.isVoted = true
        await user.save()

        res.status(200).json({message: "Vote recorded successfully"})
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Internal Server error"});
    }
})

router.get('/vote/count',async(req,res)=>{
    try{
        const candidate = await Candidate.find().sort({voteCount:'desc'})
        const voteRecord = candidate.map((data)=>{
            return{
                candidate: data.name,
                party: data.party,
                count: data.voteCount
            }
        })

        return res.status(200).json(voteRecord)
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Internal Server error"});
    }
})

router.get('/candidates',async(req,res)=>{
    try{
        const candidate = await Candidate.find()
        const candidateRecord = candidate.map((data)=>{
            return{
                candidate: data.name,
                party: data.party
            }
        })
        return res.status(200).json(candidateRecord)
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Internal Server error"});
    }
})

module.exports = router;