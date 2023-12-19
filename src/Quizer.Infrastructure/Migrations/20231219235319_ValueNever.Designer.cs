﻿// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using Quizer.Infrastructure.Persistance;

#nullable disable

namespace Quizer.Infrastructure.Migrations
{
    [DbContext(typeof(QuizerDbContext))]
    [Migration("20231219235319_ValueNever")]
    partial class ValueNever
    {
        /// <inheritdoc />
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "8.0.0")
                .HasAnnotation("Relational:MaxIdentifierLength", 63);

            NpgsqlModelBuilderExtensions.UseIdentityByDefaultColumns(modelBuilder);

            modelBuilder.Entity("Quizer.Domain.Entities.User", b =>
                {
                    b.Property<Guid>("Id")
                        .HasColumnType("uuid");

                    b.Property<string>("Email")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("FirstName")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("LastName")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Password")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.ToTable("Users");
                });

            modelBuilder.Entity("Quizer.Domain.QuizAggregate.Quiz", b =>
                {
                    b.Property<Guid>("Id")
                        .HasColumnType("uuid");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("Description")
                        .IsRequired()
                        .HasMaxLength(1000)
                        .HasColumnType("character varying(1000)");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<DateTime>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.HasKey("Id");

                    b.ToTable("Quizes", (string)null);
                });

            modelBuilder.Entity("Quizer.Domain.QuizAggregate.Quiz", b =>
                {
                    b.OwnsOne("Quizer.Domain.Common.ValueObjects.AverageRating", "AverageRating", b1 =>
                        {
                            b1.Property<Guid>("QuizId")
                                .HasColumnType("uuid");

                            b1.Property<int>("NumRatings")
                                .HasColumnType("integer");

                            b1.Property<double>("Value")
                                .HasColumnType("double precision");

                            b1.HasKey("QuizId");

                            b1.ToTable("Quizes");

                            b1.WithOwner()
                                .HasForeignKey("QuizId");
                        });

                    b.OwnsMany("Quizer.Domain.QuizAggregate.Entities.Question", "Questions", b1 =>
                        {
                            b1.Property<Guid>("Id")
                                .HasColumnType("uuid")
                                .HasColumnName("QuestionId");

                            b1.Property<Guid>("QuizId")
                                .HasColumnType("uuid");

                            b1.Property<string>("Answer")
                                .IsRequired()
                                .HasMaxLength(500)
                                .HasColumnType("character varying(500)");

                            b1.Property<string>("QuestionText")
                                .IsRequired()
                                .HasMaxLength(300)
                                .HasColumnType("character varying(300)");

                            b1.HasKey("Id", "QuizId");

                            b1.HasIndex("QuizId");

                            b1.ToTable("Questions", (string)null);

                            b1.WithOwner()
                                .HasForeignKey("QuizId");
                        });

                    b.Navigation("AverageRating")
                        .IsRequired();

                    b.Navigation("Questions");
                });
#pragma warning restore 612, 618
        }
    }
}
