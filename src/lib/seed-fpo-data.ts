import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import {
  User,
  FPO,
  FarmerGroup,
  GroupMembership,
  CommunityPost,
  CommunityComment,
  ProduceAggregation,
  BulkRequirement,
} from "@/models";
import { USER_ROLES, USER_STATUSES } from "@/types";
import { DEMO_PASSWORD } from "@/config/demo-users";

export async function seedFpoCommunityData(): Promise<{
  groupsCount: number;
  postsCount: number;
  commentsCount: number;
  aggregationsCount: number;
  bulkRequirementsCount: number;
}> {
  await connectToDatabase();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // 1. Primary FPO user & FPO profile
  let fpoUser = await User.findOne({ role: USER_ROLES.FPO });
  if (!fpoUser) {
    fpoUser = await User.create({
      name: "Odisha Farmers Producer Org",
      email: "fpo@kisanova.in",
      passwordHash,
      role: USER_ROLES.FPO,
      phone: "9876543211",
      status: USER_STATUSES.ACTIVE,
      location: {
        addressLine: "NH-16, Berhampur Hub",
        district: "Ganjam",
        state: "Odisha",
        pincode: "760001",
      },
    });
  }

  let fpoDoc = await FPO.findOne({ user: fpoUser._id });
  if (!fpoDoc) {
    fpoDoc = await FPO.create({
      user: fpoUser._id,
      organizationName: "Odisha Farmers Producer Organization",
      registrationNumber: "CIN-U01111OR2020PTC034567",
      yearOfEstablishment: 2020,
      memberFarmerCount: 145,
      cropSpecialization: ["Tomato", "Potato", "Onion", "Rice", "Vegetables"],
      aggregationCenters: [
        {
          name: "Ganjam Central Agritech Aggregation Mandi",
          address: "NH-16, Berhampur Rural Hub",
          district: "Ganjam",
          state: "Odisha",
          pincode: "760001",
          contactPerson: "Santosh Mohapatra",
          contactPhone: "9437123456",
          latitude: 19.3149,
          longitude: 84.7941,
          coldStorageAvailable: true,
        },
      ],
      annualTurnoverLakhs: 85,
    });
  }

  // 2. Demo Bulk Buyer User
  let buyerUser = await User.findOne({ role: USER_ROLES.BULK_BUYER });
  if (!buyerUser) {
    buyerUser = await User.create({
      name: "Bhubaneswar Fresh Foods",
      email: "buyer@kisanova.in",
      passwordHash,
      role: USER_ROLES.BULK_BUYER,
      phone: "9876543212",
      status: USER_STATUSES.ACTIVE,
      location: {
        addressLine: "Infocity Road, Patia",
        district: "Khordha",
        state: "Odisha",
        pincode: "751024",
      },
    });
  }

  // 3. 15+ Demo Farmers
  const demoFarmersData = [
    { name: "Ramesh Sahu", email: "ramesh.farmer@kisanova.in", phone: "9437011001", district: "Ganjam", village: "Hinjilicut" },
    { name: "Binod Jena", email: "binod.farmer@kisanova.in", phone: "9437011002", district: "Ganjam", village: "Aska" },
    { name: "Subash Patra", email: "subash.farmer@kisanova.in", phone: "9437011003", district: "Ganjam", village: "Chatrapur" },
    { name: "Bibek Meher", email: "bibek.farmer@kisanova.in", phone: "9437011004", district: "Bargarh", village: "Attabira" },
    { name: "Minati Dei", email: "minati.farmer@kisanova.in", phone: "9437011005", district: "Puri", village: "Nimapada" },
    { name: "Debendra Pradhan", email: "debendra.farmer@kisanova.in", phone: "9437011006", district: "Khordha", village: "Jatni" },
    { name: "Kishore Dash", email: "kishore.farmer@kisanova.in", phone: "9437011007", district: "Cuttack", village: "Banki" },
    { name: "Pratima Nayak", email: "pratima.farmer@kisanova.in", phone: "9437011008", district: "Balasore", village: "Remuna" },
    { name: "Santosh Biswal", email: "santosh.farmer@kisanova.in", phone: "9437011009", district: "Sambalpur", village: "Kuchinda" },
    { name: "Tapan Mahanta", email: "tapan.farmer@kisanova.in", phone: "9437011010", district: "Mayurbhanj", village: "Baripada" },
    { name: "Laxmidhar Rout", email: "laxmidhar.farmer@kisanova.in", phone: "9437011011", district: "Bhadrak", village: "Dhamnagar" },
    { name: "Manas Mohanty", email: "manas.farmer@kisanova.in", phone: "9437011012", district: "Jagatsinghpur", village: "Tirtol" },
    { name: "Sasmita Swain", email: "sasmita.farmer@kisanova.in", phone: "9437011013", district: "Kendrapara", village: "Pattamundai" },
    { name: "Basant Panda", email: "basant.farmer@kisanova.in", phone: "9437011014", district: "Gajapati", village: "Paralakhemundi" },
    { name: "Ranjan Barik", email: "ranjan.farmer@kisanova.in", phone: "9437011015", district: "Jajpur", village: "Korei" },
  ];

  const farmerDocs: Array<{ _id: mongoose.Types.ObjectId; name: string; phone: string; district: string; village: string }> = [];

  for (const f of demoFarmersData) {
    const doc = await User.findOneAndUpdate(
      { email: f.email },
      {
        name: f.name,
        email: f.email,
        phone: f.phone,
        passwordHash,
        role: USER_ROLES.FARMER,
        status: USER_STATUSES.ACTIVE,
        location: {
          addressLine: `${f.village} Gram Panchayat`,
          district: f.district,
          state: "Odisha",
          pincode: "760001",
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    farmerDocs.push({
      _id: doc._id,
      name: doc.name,
      phone: doc.phone,
      district: f.district,
      village: f.village,
    });
  }

  // 4. Five Farmer Groups
  const groupsSeed = [
    {
      name: "Ganjam Tomato Growers Collective",
      description: "Dedicated group for tomato cultivators in Ganjam district. Real-time Mandi price sharing, collective cold-chain pooling, and bulk marketing.",
      product: "Tomato",
      category: "Fresh Vegetables",
      village: "Hinjilicut",
      district: "Ganjam",
      state: "Odisha",
      privacy: "PUBLIC" as const,
      image: "/crops/tomato.png",
      creatorIndex: 0, // Ramesh Sahu
      initialAggTarget: 800,
      initialPrice: 28,
    },
    {
      name: "Coastal Green Vegetable Association",
      description: "Puri and Khordha growers network for leafy greens, pointed gourd (potol), okra, and brinjal. Direct institutional supplying.",
      product: "Mixed Vegetables",
      category: "Fresh Vegetables",
      village: "Nimapada",
      district: "Puri",
      state: "Odisha",
      privacy: "PUBLIC" as const,
      image: "/crops/vegetables.png",
      creatorIndex: 4, // Minati Dei
      initialAggTarget: 1000,
      initialPrice: 35,
    },
    {
      name: "Bargarh Quality Rice Producers",
      description: "Rice bowl of Odisha grower network. Basmati, Swarna, and MTU 1010 paddy pooling with direct mill and institutional procurement.",
      product: "Rice",
      category: "Grains & Cereals",
      village: "Attabira",
      district: "Bargarh",
      state: "Odisha",
      privacy: "PUBLIC" as const,
      image: "/crops/grains.png",
      creatorIndex: 3, // Bibek Meher
      initialAggTarget: 3000,
      initialPrice: 42,
    },
    {
      name: "Organic Ginger & Turmeric Pool",
      description: "Kandhamal and Gajapati tribal hills certified organic turmeric and high-curcumin ginger growers collective.",
      product: "Turmeric",
      category: "Spices & Condiments",
      village: "Paralakhemundi",
      district: "Gajapati",
      state: "Odisha",
      privacy: "PUBLIC" as const,
      image: "/crops/spices.png",
      creatorIndex: 13, // Basant Panda
      initialAggTarget: 1200,
      initialPrice: 95,
    },
    {
      name: "Balasore Onion Cultivators Group",
      description: "Rabi and Kharif red onion producers in Balasore and Bhadrak. Collective grading, curing storage, and interstate mandi trading.",
      product: "Onion",
      category: "Fresh Vegetables",
      village: "Remuna",
      district: "Balasore",
      state: "Odisha",
      privacy: "PUBLIC" as const,
      image: "/crops/onion.png",
      creatorIndex: 7, // Pratima Nayak
      initialAggTarget: 1500,
      initialPrice: 26,
    },
  ];

  const createdGroups: Array<{ _id: mongoose.Types.ObjectId; name: string; product: string; category: string; initialAggTarget: number; initialPrice: number }> = [];

  for (const g of groupsSeed) {
    const creator = farmerDocs[g.creatorIndex];
    let group = await FarmerGroup.findOne({ name: g.name });
    if (!group) {
      group = await FarmerGroup.create({
        name: g.name,
        description: g.description,
        product: g.product,
        category: g.category,
        location: {
          village: g.village,
          district: g.district,
          state: g.state,
        },
        privacy: g.privacy,
        image: g.image,
        creatorId: creator._id,
        fpoId: fpoDoc._id,
        memberCount: 1,
        postCount: 0,
        aggregatedQuantityKg: 0,
      });
    }

    createdGroups.push({
      _id: group._id,
      name: group.name,
      product: group.product,
      category: group.category,
      initialAggTarget: g.initialAggTarget,
      initialPrice: g.initialPrice,
    });
  }

  // 5. Memberships (Distribute farmers into groups)
  for (let i = 0; i < farmerDocs.length; i++) {
    const farmer = farmerDocs[i];
    // Assign to first 2 matching or relevant groups
    const assignedGroup1 = createdGroups[i % createdGroups.length];
    const assignedGroup2 = createdGroups[(i + 1) % createdGroups.length];

    for (const grp of [assignedGroup1, assignedGroup2]) {
      const exists = await GroupMembership.findOne({ groupId: grp._id, userId: farmer._id });
      if (!exists) {
        await GroupMembership.create({
          groupId: grp._id,
          userId: farmer._id,
          role: i < 5 ? "ADMIN" : "MEMBER",
          status: "ACTIVE",
          joinedAt: new Date(Date.now() - (i + 1) * 86400 * 1000),
        });
        await FarmerGroup.findByIdAndUpdate(grp._id, { $inc: { memberCount: 1 } });
      }
    }
  }

  // Ensure FPO user is member/admin of all groups
  for (const grp of createdGroups) {
    const exists = await GroupMembership.findOne({ groupId: grp._id, userId: fpoUser._id });
    if (!exists) {
      await GroupMembership.create({
        groupId: grp._id,
        userId: fpoUser._id,
        role: "OWNER",
        status: "ACTIVE",
        joinedAt: new Date(Date.now() - 30 * 86400 * 1000),
      });
      await FarmerGroup.findByIdAndUpdate(grp._id, { $inc: { memberCount: 1 } });
    }
  }

  // 6. Community Posts (20+ realistic posts)
  const postsSeedData = [
    // Tomato Group
    {
      groupIndex: 0,
      farmerIndex: 0,
      postType: "MARKET_PRICE" as const,
      title: "Today's Mandi Price at Hinjilicut Regulated Market",
      content: "Harvested 40 crates of hybrid tomato this morning. Hinjilicut Mandi modal rate is ₹28–₹30/kg for Grade A. Commission agent was offering ₹24/kg farm-gate, but if we pool together we can command ₹32/kg directly from Bhubaneswar buyers.",
      marketPriceDetails: { crop: "Tomato", pricePerKg: 29, marketName: "Hinjilicut Regulated Mandi", location: "Ganjam, Odisha", reportedDate: "Today" },
    },
    {
      groupIndex: 0,
      farmerIndex: 1,
      postType: "BULK_SELLING" as const,
      title: "Pooled 180 kg Grade A Tomato towards collective order",
      content: "I have added 180 kg of freshly picked tomatoes to our group pool. Firm fruit, zero blemish, ready for cold dispatch on Friday. Total pool is approaching 700 kg!",
      marketPriceDetails: { crop: "Tomato", pricePerKg: 30, marketName: "Aska Mandi Yard", location: "Ganjam, Odisha", reportedDate: "Yesterday" },
    },
    {
      groupIndex: 0,
      farmerIndex: 2,
      postType: "PROBLEM" as const,
      title: "Early Blight spotting on lower leaves after rain",
      content: "Noticed small concentric ring brown spots on the lower foliage after Sunday's showers. Planning to apply Copper Oxychloride (2.5g/L) or Trichoderma viride. Has anyone tested bio-fungicide efficacy this season?",
    },
    {
      groupIndex: 0,
      farmerIndex: 0,
      postType: "FARMING_TIPS" as const,
      title: "Mulching + Drip irrigation reduced blossom end rot by 80%",
      content: "Used 25-micron silver-black plastic mulch with 16mm inline drip laterals this crop cycle. Calcium deficiency was completely prevented because soil moisture remained 100% stable during afternoon heat.",
    },
    {
      groupIndex: 0,
      farmerIndex: 14, // Ranjan
      postType: "DEMAND" as const,
      title: "Cuttack wholesale buyer inquiry for 500 kg weekly",
      content: "A restaurant distributor from Malgodown Cuttack is looking for 500 kg weekly continuous supply of firm table tomatoes at ₹31/kg farm-gate. Let's discuss pooling our weekly harvest schedules.",
    },

    // Coastal Vegetable Association
    {
      groupIndex: 1,
      farmerIndex: 4, // Minati
      postType: "MARKET_PRICE" as const,
      title: "Nimapada Morning Vegetable Market Rates",
      content: "Pointed gourd (Potol) selling strong at ₹42/kg. Lady finger (Bhindi) at ₹34/kg. Local arrivals are lower due to canal maintenance. Best time to sell directly.",
      marketPriceDetails: { crop: "Pointed Gourd", pricePerKg: 42, marketName: "Nimapada Daily Haat", location: "Puri, Odisha", reportedDate: "Today" },
    },
    {
      groupIndex: 1,
      farmerIndex: 5, // Debendra
      postType: "FARMING_TIPS" as const,
      title: "Neem oil emulsion (10,000 ppm) controlling fruit borer",
      content: "Spray at 3ml/L along with 1ml liquid detergent during dusk. Completely avoided synthetic pyrethroids this season, preserving natural predatory wasps.",
    },
    {
      groupIndex: 1,
      farmerIndex: 6, // Kishore
      postType: "ANNOUNCEMENT" as const,
      title: "Kisan Credit Card (KCC) renewal camp at Block Agriculture Office",
      content: "The Gagan Agriculture Officer announced a special desk on Tuesday for speedy KCC credit limit enhancement and interest subvention verification.",
    },
    {
      groupIndex: 1,
      farmerIndex: 4,
      postType: "BULK_SELLING" as const,
      title: "200 kg Crisp Green Brinjal available for joint pickup",
      content: "Fresh round green brinjal harvest ready tomorrow morning. Can consolidate with any Bhubaneswar-bound vehicle for shared freight savings.",
    },

    // Bargarh Rice
    {
      groupIndex: 2,
      farmerIndex: 3, // Bibek
      postType: "MARKET_PRICE" as const,
      title: "Swarna Paddy Mandi Rates at Attabira RMC",
      content: "Government MSP procurement is ₹2,300/quintal. Private millers offering ₹2,420/quintal spot cash for moisture < 14%. Keep moisture meter handy before dispatching.",
      marketPriceDetails: { crop: "Paddy (Swarna)", pricePerKg: 24.2, marketName: "Attabira Regulated Market Yard", location: "Bargarh, Odisha", reportedDate: "Today" },
    },
    {
      groupIndex: 2,
      farmerIndex: 8, // Santosh
      postType: "FARMING_TIPS" as const,
      title: "Alternate Wetting and Drying (AWD) saved 30% diesel pump cost",
      content: "Installed 30cm perforated PVC field pipes to check water table depth. Irrigation delayed until water drops 15cm below soil surface with zero yield reduction.",
    },
    {
      groupIndex: 2,
      farmerIndex: 3,
      postType: "DEMAND" as const,
      title: "Non-Basmati organic certified rice requirement: 25 Quintals",
      content: "An organic retail chain in Kolkata contacted our FPO for 25 quintals of unpolished brown rice. Farmers with NPOP certification please comment.",
    },

    // Turmeric & Ginger
    {
      groupIndex: 3,
      farmerIndex: 13, // Basant
      postType: "MARKET_PRICE" as const,
      title: "Dry Turmeric Finger Rate in Raikia Mandi",
      content: "Raikia spice market trading dry fingers at ₹95–₹105/kg depending on curcumin level. High-curcumin (5.2%+) lots fetching ₹120/kg from pharmaceutical buyers.",
      marketPriceDetails: { crop: "Turmeric (Dry)", pricePerKg: 102, marketName: "Raikia Spice Mandi", location: "Kandhamal/Gajapati, Odisha", reportedDate: "Yesterday" },
    },
    {
      groupIndex: 3,
      farmerIndex: 9, // Tapan
      postType: "PROBLEM" as const,
      title: "Rhizome rot in ginger beds after water-logging",
      content: "Heavy thunderstorm caused brief stagnation in bed 3. Noticed pseudo-stem softening and unpleasant smell. Applying Trichoderma drenching immediately.",
    },
    {
      groupIndex: 3,
      farmerIndex: 13,
      postType: "FARMING_TIPS" as const,
      title: "Solar bubble dryer reduced drying cycle from 14 days to 4 days",
      content: "Turmeric slices dried evenly to 8% moisture without dust contamination or bleaching from direct UV rays. Oil and curcumin retention is noticeably superior.",
    },

    // Onion Group
    {
      groupIndex: 4,
      farmerIndex: 7, // Pratima
      postType: "MARKET_PRICE" as const,
      title: "Balasore Central Yard Red Onion Rates",
      content: "Nasik arrivals into Odisha are delayed. Local medium red onion wholesale rate shot up to ₹27–₹28/kg. Farmers storing in aerated mesh racks should hold for 5 more days.",
      marketPriceDetails: { crop: "Onion (Red)", pricePerKg: 27.5, marketName: "Balasore Daily Wholesale Yard", location: "Balasore, Odisha", reportedDate: "Today" },
    },
    {
      groupIndex: 4,
      farmerIndex: 10, // Laxmidhar
      postType: "BULK_SELLING" as const,
      title: "Pooled 200 kg Cured Red Onion into Group Cold-Storage",
      content: "Grade A medium size (45-55mm) cured bulbs deposited into FPO Berhampur cold room. Clean dried skin, ready for bulk buyer fulfillment.",
    },
    {
      groupIndex: 4,
      farmerIndex: 14, // Ranjan
      postType: "FARMING_TIPS" as const,
      title: "Potash top-dressing 30 days before harvest doubles shelf-life",
      content: "Applied SOP (Sulphate of Potash) @ 25 kg/acre. Neck thickness reduced quickly, leading to tighter bulb closure and significantly less rotting during storage.",
    },
    {
      groupIndex: 4,
      farmerIndex: 7,
      postType: "DEMAND" as const,
      title: "Hotelier Association Cuttack tender for 10 Quintals Red Onion",
      content: "Target procurement price ₹28/kg delivered to Cuttack. If we bundle our 550 kg pool with 450 kg from Bhadrak members, we can fulfill this seamlessly.",
    },
    {
      groupIndex: 0,
      farmerIndex: 2, // Subash
      postType: "GENERAL" as const,
      title: "Welcome to all new Hinjilicut tomato growers!",
      content: "Glad to see 18 members active here. Let's make sure everyone enters their expected harvest dates in the Aggregation tab so our FPO coordinator can match big buyer contracts.",
    },
  ];

  const createdPosts: Array<{ _id: mongoose.Types.ObjectId; authorName: string }> = [];

  for (const p of postsSeedData) {
    const grp = createdGroups[p.groupIndex];
    const farmer = farmerDocs[p.farmerIndex];

    const postDoc = await CommunityPost.create({
      groupId: grp._id,
      fpoId: fpoDoc._id,
      authorId: farmer._id,
      authorName: farmer.name,
      authorRole: "FARMER",
      title: p.title,
      content: p.content,
      postType: p.postType,
      productName: grp.product,
      marketPriceDetails: p.marketPriceDetails,
      likes: [farmerDocs[(p.farmerIndex + 1) % farmerDocs.length]._id.toString(), fpoUser._id.toString()],
      commentCount: 0,
      isPinned: p.postType === "ANNOUNCEMENT",
      isAnnouncement: p.postType === "ANNOUNCEMENT",
      status: "ACTIVE",
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 86400 * 1000)),
    });

    await FarmerGroup.findByIdAndUpdate(grp._id, { $inc: { postCount: 1 } });
    createdPosts.push({ _id: postDoc._id, authorName: farmer.name });
  }

  // 7. Community Comments (30+ comments)
  const commentTexts = [
    "Thank you for sharing this live price update! Very helpful for bargaining.",
    "I can also contribute 150 kg next Tuesday if the buyer takes delivery at the mandi.",
    "Trichoderma drenching worked well for me last season. Make sure soil is moist.",
    "Agreed! Direct pooling saves at least ₹3/kg on middleman commission and freight.",
    "What is the minimum grade requirement for this lot?",
    "Grade A only (uniform color, firm skin, minimum 60mm diameter).",
    "Where is the nearest cold storage collection point for this group?",
    "Berhampur Rural Hub on NH-16. Contact Santosh Mohapatra for gate pass.",
    "Will join the KCC renewal camp on Tuesday. Great reminder!",
    "Our village has 8 farmers ready to pool 400 kg more next weekend.",
  ];

  let commentsCreated = 0;
  for (let i = 0; i < createdPosts.length; i++) {
    const post = createdPosts[i];
    const c1 = commentTexts[i % commentTexts.length];
    const c2 = commentTexts[(i + 3) % commentTexts.length];

    const replier1 = farmerDocs[(i + 2) % farmerDocs.length];
    const replier2 = farmerDocs[(i + 4) % farmerDocs.length];

    const commentDoc1 = await CommunityComment.create({
      postId: post._id,
      authorId: replier1._id,
      authorName: replier1.name,
      authorRole: "FARMER",
      content: c1,
      likes: [],
      createdAt: new Date(Date.now() - (i + 1) * 3600 * 1000),
    });
    commentsCreated++;

    // Threaded reply to comment 1
    await CommunityComment.create({
      postId: post._id,
      authorId: replier2._id,
      authorName: replier2.name,
      authorRole: "FARMER",
      content: c2,
      parentCommentId: commentDoc1._id,
      likes: [],
      createdAt: new Date(Date.now() - i * 3600 * 1000),
    });
    commentsCreated++;

    await CommunityPost.findByIdAndUpdate(post._id, { $inc: { commentCount: 2 } });
  }

  // 8. Produce Aggregations (Pools)
  // Group 0: Ganjam Tomato pool (700 kg pooled)
  const tomatoGroup = createdGroups[0];
  const tomatoContributions = [
    {
      farmerId: farmerDocs[0]._id,
      farmerName: farmerDocs[0].name,
      farmerPhone: farmerDocs[0].phone,
      quantity: 120,
      expectedPrice: 28,
      qualityGrade: "Grade A",
      harvestDate: new Date(),
      availableDate: new Date(Date.now() + 2 * 86400 * 1000),
      status: "COMMITTED" as const,
      contributedAt: new Date(Date.now() - 3 * 86400 * 1000),
    },
    {
      farmerId: farmerDocs[1]._id,
      farmerName: farmerDocs[1].name,
      farmerPhone: farmerDocs[1].phone,
      quantity: 180,
      expectedPrice: 30,
      qualityGrade: "Grade A",
      harvestDate: new Date(),
      availableDate: new Date(Date.now() + 2 * 86400 * 1000),
      status: "COMMITTED" as const,
      contributedAt: new Date(Date.now() - 2 * 86400 * 1000),
    },
    {
      farmerId: farmerDocs[2]._id,
      farmerName: farmerDocs[2].name,
      farmerPhone: farmerDocs[2].phone,
      quantity: 250,
      expectedPrice: 29,
      qualityGrade: "Grade A",
      harvestDate: new Date(),
      availableDate: new Date(Date.now() + 3 * 86400 * 1000),
      status: "COMMITTED" as const,
      contributedAt: new Date(Date.now() - 1 * 86400 * 1000),
    },
    {
      farmerId: farmerDocs[3]._id, // Bibek Meher
      farmerName: farmerDocs[3].name,
      farmerPhone: farmerDocs[3].phone,
      quantity: 150,
      expectedPrice: 30,
      qualityGrade: "Grade A",
      harvestDate: new Date(),
      availableDate: new Date(Date.now() + 1 * 86400 * 1000),
      status: "COMMITTED" as const,
      contributedAt: new Date(),
    },
  ];

  await ProduceAggregation.findOneAndUpdate(
    { groupId: tomatoGroup._id },
    {
      groupId: tomatoGroup._id,
      fpoId: fpoDoc._id,
      productName: "Tomato",
      category: "Fresh Vegetables",
      unit: "kg",
      targetQuantity: 800,
      totalQuantity: 700,
      availableQuantity: 700,
      reservedQuantity: 0,
      targetPrice: 30,
      status: "OPEN",
      contributions: tomatoContributions,
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
  await FarmerGroup.findByIdAndUpdate(tomatoGroup._id, { aggregatedQuantityKg: 700 });

  // Group 4: Balasore Onion pool (550 kg pooled)
  const onionGroup = createdGroups[4];
  const onionContributions = [
    {
      farmerId: farmerDocs[7]._id, // Pratima
      farmerName: farmerDocs[7].name,
      farmerPhone: farmerDocs[7].phone,
      quantity: 200,
      expectedPrice: 26,
      qualityGrade: "Grade A",
      harvestDate: new Date(),
      availableDate: new Date(Date.now() + 4 * 86400 * 1000),
      status: "COMMITTED" as const,
      contributedAt: new Date(Date.now() - 2 * 86400 * 1000),
    },
    {
      farmerId: farmerDocs[10]._id, // Laxmidhar
      farmerName: farmerDocs[10].name,
      farmerPhone: farmerDocs[10].phone,
      quantity: 200,
      expectedPrice: 25,
      qualityGrade: "Grade A",
      harvestDate: new Date(),
      availableDate: new Date(Date.now() + 3 * 86400 * 1000),
      status: "COMMITTED" as const,
      contributedAt: new Date(Date.now() - 1 * 86400 * 1000),
    },
    {
      farmerId: farmerDocs[14]._id, // Ranjan
      farmerName: farmerDocs[14].name,
      farmerPhone: farmerDocs[14].phone,
      quantity: 150,
      expectedPrice: 27,
      qualityGrade: "Grade B",
      harvestDate: new Date(),
      availableDate: new Date(Date.now() + 5 * 86400 * 1000),
      status: "COMMITTED" as const,
      contributedAt: new Date(),
    },
  ];

  await ProduceAggregation.findOneAndUpdate(
    { groupId: onionGroup._id },
    {
      groupId: onionGroup._id,
      fpoId: fpoDoc._id,
      productName: "Onion",
      category: "Fresh Vegetables",
      unit: "kg",
      targetQuantity: 1000,
      totalQuantity: 550,
      availableQuantity: 550,
      reservedQuantity: 0,
      targetPrice: 26,
      status: "OPEN",
      contributions: onionContributions,
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
  await FarmerGroup.findByIdAndUpdate(onionGroup._id, { aggregatedQuantityKg: 550 });

  // 9. Bulk Buyer Requirements
  const bulkRequirementsSeed = [
    {
      buyer: buyerUser._id,
      buyerName: "Bhubaneswar Fresh Foods Pvt Ltd",
      buyerPhone: "9876543212",
      productName: "Tomato",
      category: "Fresh Vegetables",
      requiredQuantity: 600,
      unit: "kg" as const,
      targetPrice: 32, // Attractive price higher than expected 29-30!
      requiredDate: new Date(Date.now() + 4 * 86400 * 1000),
      deliveryLocation: {
        district: "Khordha",
        state: "Odisha",
        pincode: "751024",
        deliveryHubName: "Patia Central Cold Consolidation Hub",
      },
      qualityPreference: "Grade A uniform red table tomato, zero soft spots",
      notes: "Weekly recurring requirement if batch quality meets FSSAI standards. Direct NEFT payment upon dispatch verification.",
      status: "OPEN" as const,
      matchedSuppliers: [],
    },
    {
      buyer: buyerUser._id,
      buyerName: "Kalinga Supermarkets Chain",
      buyerPhone: "9876543213",
      productName: "Onion",
      category: "Fresh Vegetables",
      requiredQuantity: 500,
      unit: "kg" as const,
      targetPrice: 28,
      requiredDate: new Date(Date.now() + 6 * 86400 * 1000),
      deliveryLocation: {
        district: "Cuttack",
        state: "Odisha",
        pincode: "753001",
        deliveryHubName: "Malgodown Retail Hub",
      },
      qualityPreference: "Cured red onion, 45mm to 60mm diameter",
      notes: "Immediate dispatch required. Transport provided by buyer if collected at Berhampur hub.",
      status: "OPEN" as const,
      matchedSuppliers: [],
    },
    {
      buyer: buyerUser._id,
      buyerName: "Puri Temple Trust Kitchens",
      buyerPhone: "9876543214",
      productName: "Rice",
      category: "Grains & Cereals",
      requiredQuantity: 1000,
      unit: "kg" as const,
      targetPrice: 45,
      requiredDate: new Date(Date.now() + 10 * 86400 * 1000),
      deliveryLocation: {
        district: "Puri",
        state: "Odisha",
        pincode: "752001",
        deliveryHubName: "Grand Road Kitchen Logistics Gate",
      },
      qualityPreference: "Premium aged non-boiled traditional grain",
      notes: "Strict quality inspection at gate. Escrow locked payment via KisanDirect.",
      status: "OPEN" as const,
      matchedSuppliers: [],
    },
  ];

  for (const b of bulkRequirementsSeed) {
    await BulkRequirement.findOneAndUpdate(
      { buyerName: b.buyerName, productName: b.productName },
      b,
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  }

  return {
    groupsCount: createdGroups.length,
    postsCount: createdPosts.length,
    commentsCount: commentsCreated,
    aggregationsCount: 2,
    bulkRequirementsCount: bulkRequirementsSeed.length,
  };
}
