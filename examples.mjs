export const examples={
 unsafe:{initial:'Draft',unsafe:['Published without review'],terminal:['Published'],transitions:[{from:'Draft',action:'Submit',to:'Pending review'},{from:'Pending review',action:'Approve',to:'Approved'},{from:'Approved',action:'Publish',to:'Published'},{from:'Draft',action:'Legacy publish endpoint',to:'Published without review'}]},
 repaired:{initial:'Draft',unsafe:['Published without review'],terminal:['Published'],transitions:[{from:'Draft',action:'Submit',to:'Pending review'},{from:'Pending review',action:'Reject',to:'Draft'},{from:'Pending review',action:'Approve',to:'Approved'},{from:'Approved',action:'Publish',to:'Published'}]},
 deadlock:{initial:'Queued',unsafe:['Unauthorized execution'],terminal:['Done'],transitions:[{from:'Queued',action:'Assign reviewer',to:'Awaiting unavailable reviewer'}]}
};
