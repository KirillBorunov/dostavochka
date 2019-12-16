using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Dostavochka.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Dostavochka.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dostavochka.Controllers
{
    [Authorize]
    [Route("[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        [HttpGet("getActive")]
        public async Task<IActionResult> GetActiveAsync()
        {
            var userId = int.Parse(this.User.FindFirst(ClaimTypes.Name).Value);

            using (var db = new AppDbContext())
            {
                var order = await db.Orders.Include("Order_Products").SingleOrDefaultAsync(p => p.OwnerId == userId && p.Status < 3);
                if (order == null) return Ok();
                else return Ok(order);
            }

        }

        [HttpGet("getHistory")]
        public async Task<IActionResult> GetHistoryAsync()
        {
            var userId = int.Parse(this.User.FindFirst(ClaimTypes.Name).Value);

            using (var db = new AppDbContext())
            {
                var orders = await db.Orders.Include("Order_Products").Where(p => p.OwnerId == userId).ToArrayAsync();
                
                return Ok(orders);
            }

        }

        [HttpGet("getAcceptable")]
        public async Task<IActionResult> GetAcceptableAsync()
        {
            var userId = int.Parse(this.User.FindFirst(ClaimTypes.Name).Value);

            using (var db = new AppDbContext())
            {
                var orders = await db.Orders.Include("Order_Products").Where(p => p.OwnerId != userId && p.Status == 0).ToArrayAsync();

                return Ok(orders);
                
            }

        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateAsync(CreateOrderModel model)
        {
            var userId = int.Parse(this.User.FindFirst(ClaimTypes.Name).Value);

            if (this.ModelState.IsValid)
            {

                if (model.Products.Count < 1) {
                    this.ModelState.AddModelError("Products", "Нет продуктов.");
                    return BadRequest(ModelState);
                }

                using (var db = new AppDbContext())
                {
                    var order = await db.Orders.SingleOrDefaultAsync(p => p.OwnerId == userId && p.Status < 2);
                    if (order != null)
                    {
                        this.ModelState.AddModelError("Order", "У вас уже есть активный заказ.");
                        return BadRequest(ModelState);
                    }
                    if (string.IsNullOrEmpty(model.Memo)) model.Memo = "-";

                    var newOrder = new Order()
                    {
                        Address = model.Address,
                        Budget = model.Budget,
                        Memo = model.Memo,
                        OwnerId = userId,
                        Tip = model.Tip,
                        Status = 0,
                        Moment = DateTime.Now,
                        Order_Products = new List<Order_Product>()
                    };

                    foreach (var prod in model.Products)
                    {
                        newOrder.Order_Products.Add(new Order_Product() {
                            Budget = prod.Budget,
                            Count = prod.Count,
                            Description = prod.Description,
                            ProductId = prod.ProductId,
                            Unit = prod.Unit
                        });
                    }

                    db.Orders.Add(newOrder);

                    await db.SaveChangesAsync();

                    return Ok();
                }

            } else
            {
                return BadRequest(model);
            }

        }

        [HttpPost("cancel/{id}")]
        public async Task<IActionResult> CancelAsync(int id)
        {
            var userId = int.Parse(this.User.FindFirst(ClaimTypes.Name).Value);

            using (var db = new AppDbContext())
            {
                var order = await db.Orders.SingleOrDefaultAsync(p => p.OrderId == id && (p.OwnerId == userId && p.Status == 0 || p.OwnerId != userId && p.Status == 1));
                if (order == null)
                {
                    this.ModelState.AddModelError("Order", "Этот заказ нельзя отменить.");
                    return BadRequest(ModelState);
                }

                //TODO: check que el usuario que intenta cancelar sea el que acepto el trabajo

                order.Status = 3; //cancelado

                await db.SaveChangesAsync();

                return Ok();
            }

        }

        [HttpPost("accept/{id}")]
        public async Task<IActionResult> AcceptAsync(int id)
        {
            var userId = int.Parse(this.User.FindFirst(ClaimTypes.Name).Value);

            using (var db = new AppDbContext())
            {
                var order = await db.Orders.SingleOrDefaultAsync(p => p.OrderId == id && p.OwnerId != userId);
                if (order == null || order != null && order.Status > 1)
                {
                    this.ModelState.AddModelError("Order", "Этот заказ нельзя принять.");
                    return BadRequest(ModelState);
                }

                var acc = await db.Accepted_Orders.SingleOrDefaultAsync(p => p.OrderId == id);
                if (acc != null) {
                    if (acc.UserId == userId)
                    {
                        return Ok(); //workaround a problema en app
                    }
                    else
                    {
                        this.ModelState.AddModelError("Order", "Этот заказ уже принять другим пользователям.");
                        return BadRequest(ModelState);
                    }
                }

                var accepted = new Accepted_Order() { 
                 UserId = userId,
                  OrderId = order.OrderId,
                   Moment = DateTime.Now
                };

                order.Status = 1;
                db.Accepted_Orders.Add(accepted);

                await db.SaveChangesAsync();

                return Ok();
            }

        }

        [HttpPost("finish/{id}")]
        public async Task<IActionResult> FinishAsync(int id, [FromBody] FinishOrderModel model)
        {
            var userId = int.Parse(this.User.FindFirst(ClaimTypes.Name).Value);

            using (var db = new AppDbContext())
            {
                var order = await db.Orders.SingleOrDefaultAsync(p => p.OrderId == id && p.Status == 1);
                if (order == null)
                {
                    this.ModelState.AddModelError("Order", "Этот заказ нельзя завершить.");
                    return BadRequest(ModelState);
                }

                var acc = await db.Accepted_Orders.SingleOrDefaultAsync(p => p.OrderId == id);
                if (acc == null || acc.UserId != userId)
                    {
                    this.ModelState.AddModelError("Order", "Этот заказ нельзя завершить.");
                    return BadRequest(ModelState);
                }
  
                var fin = await db.Finished_Orders.SingleOrDefaultAsync(p => p.OrderId == id);
                if (fin != null)
                {
                    this.ModelState.AddModelError("Order", "Этот заказ уже завершён другим пользователям.");
                    return BadRequest(ModelState);
                }

                var finished = new Finished_Order()
                {
                    OrderId = order.OrderId,
                    Moment = DateTime.Now,
                    Memo = string.IsNullOrEmpty(model.Memo) ? "-" : ""
                };

                order.Status = 2;
                db.Finished_Orders.Add(finished);

                await db.SaveChangesAsync();

                return Ok();
            }

        }

        [HttpPost("confirm/{id}")]
        public async Task<IActionResult> ConfirmAsync(int id, [FromBody] ConfirmOrderModel model)
        {
            var userId = int.Parse(this.User.FindFirst(ClaimTypes.Name).Value);

            using (var db = new AppDbContext())
            {
                var order = await db.Orders.SingleOrDefaultAsync(p => p.OrderId == id && p.OwnerId == userId && p.Status == 2);
                if (order == null)
                {
                    this.ModelState.AddModelError("Order", "Этот заказ нельзя подтвердить.");
                    return BadRequest(ModelState);
                }



                var confirmed = new Confirmed_Order()
                {
                    OrderId = order.OrderId,
                    Moment = DateTime.Now,
                    Memo = string.IsNullOrEmpty(model.Memo) ? "-" : ""
                };

                order.Status = 4;
                db.Confirmed_Orders.Add(confirmed);

                await db.SaveChangesAsync();

                return Ok();
            }

        }
    }
    
}
