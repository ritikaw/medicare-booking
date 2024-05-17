import mongoose from "mongoose";
import Doctor from './DoctorSchema.js'

const reviewSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Types.ObjectId,
      ref: "Doctor",
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    reviewText: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
      default: 0,
    },
  },
  { timestamps: true }
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo",
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (doctorId) {
  const stats = await this.aggregate([
    {
      $match: { doctor: doctorId },
    },
    {
      $group: {
        _id: "$doctor",
        numOfRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  // console.log("Stats:", stats);

    const { numOfRating, avgRating } = stats[0];
    // console.log("Updating doctor with ID:", doctorId);
    // console.log("Total Ratings:", numOfRating);
    // console.log("Average Rating:", avgRating);

    await Doctor.findByIdAndUpdate(doctorId, {
      totalRating: numOfRating,
      averageRating: avgRating,
    });
};

reviewSchema.post("save", function () {
  // console.log("A new review is saved. Updating ratings...");
  this.constructor.calcAverageRatings(this.doctor);
});


export default mongoose.model("Review", reviewSchema);
