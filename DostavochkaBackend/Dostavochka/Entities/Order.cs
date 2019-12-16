using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace Dostavochka.Entities
{
    public class Order
    {
        [Key]
        public int OrderId { get; set; }
        [Required]
        public int OwnerId { get; set; }
        [Required]
        public string Memo { get; set; }
        [Required]
        public decimal Budget { get; set; }
        [Required]
        public decimal Tip { get; set; }
        [Required]
        public string Address { get; set; }
        [Required]
        public byte Status { get; set; }
        [Required]
        public DateTime Moment { get; set; }

        public List<Order_Product> Order_Products { get; set; }
    }
}
