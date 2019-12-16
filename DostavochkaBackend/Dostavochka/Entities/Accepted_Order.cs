using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace Dostavochka.Entities
{
    public class Accepted_Order
    {
        [Key]
        [Required]
        public int OrderId { get; set; }
        [Required]
        public int UserId { get; set; }
        [Required]
        public DateTime Moment { get; set; }
    }
}
